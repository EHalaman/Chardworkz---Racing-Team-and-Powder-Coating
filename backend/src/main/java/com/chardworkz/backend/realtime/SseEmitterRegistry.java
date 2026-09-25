package com.chardworkz.backend.realtime;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Thread-safe registry of open SSE connections, keyed by account id. Each
 * account maps to a *list* of connections, not a single one - an Owner
 * routinely has more than one tab/device open, and a single-emitter design
 * would let a second connection silently evict the first, leaving that
 * earlier tab open in the browser but permanently deaf (see
 * docs/realtime-sales-sync-spec-2026-09-25.md).
 */
@Component
public class SseEmitterRegistry {

    private record Connection(SseEmitter emitter, String role, String branchCode) {}

    private final Map<Long, CopyOnWriteArrayList<Connection>> connectionsByAccountId = new ConcurrentHashMap<>();

    public void register(Long accountId, String role, String branchCode, SseEmitter emitter) {
        Connection connection = new Connection(emitter, role, branchCode);
        connectionsByAccountId.computeIfAbsent(accountId, id -> new CopyOnWriteArrayList<>()).add(connection);

        Runnable cleanup = () -> removeConnection(accountId, connection);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ex -> cleanup.run());
    }

    /** Every OWNER connection, plus every connection whose own branch matches - not a per-branch subscription list, since branch scope is already known from each connection's JWT claims at register() time. */
    public void sendToBranch(String branchCode, String eventName, Object payload) {
        connectionsByAccountId.values().forEach(connections -> {
            for (Connection connection : connections) {
                if ("OWNER".equals(connection.role()) || branchCode.equals(connection.branchCode())) {
                    send(connection, eventName, payload);
                }
            }
        });
    }

    public void sendToUser(Long accountId, String eventName, Object payload) {
        List<Connection> connections = connectionsByAccountId.get(accountId);
        if (connections == null) {
            return;
        }
        for (Connection connection : connections) {
            send(connection, eventName, payload);
        }
    }

    /** Force-closes every open stream for this account - see AccountStatusChangedEvent's listener. */
    public void revokeUserStreams(Long accountId) {
        List<Connection> connections = connectionsByAccountId.remove(accountId);
        if (connections == null) {
            return;
        }
        for (Connection connection : connections) {
            connection.emitter().complete();
        }
    }

    /** Periodic no-op comment so an idle connection still emits something - several reverse proxies/load balancers silently kill a connection with no bytes for ~60s. */
    public void pingAll() {
        connectionsByAccountId.values().forEach(connections -> {
            for (Connection connection : connections) {
                try {
                    connection.emitter().send(SseEmitter.event().comment("keep-alive"));
                } catch (IOException e) {
                    // A failed send means the connection is already dead client-side
                    // (closed tab, dropped network) - complete it with the error,
                    // which triggers this emitter's onError callback (registered in
                    // register()) and removes it from the registry, rather than
                    // silently retrying against a socket that's gone.
                    connection.emitter().completeWithError(e);
                }
            }
        });
    }

    private void send(Connection connection, String eventName, Object payload) {
        try {
            connection.emitter().send(SseEmitter.event().name(eventName).data(payload));
        } catch (IOException e) {
            connection.emitter().completeWithError(e);
        }
    }

    private void removeConnection(Long accountId, Connection connection) {
        connectionsByAccountId.computeIfPresent(accountId, (id, connections) -> {
            connections.remove(connection);
            return connections.isEmpty() ? null : connections;
        });
    }
}
