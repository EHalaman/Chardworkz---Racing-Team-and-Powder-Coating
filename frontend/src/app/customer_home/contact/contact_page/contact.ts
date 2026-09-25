import { Component, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { formatPHMobileAsTyped, isValidPHMobileNumber } from '../../../core/utils/ph-phone.util';

export interface ContactBranch {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  embedUrl: SafeResourceUrl;
}

interface BranchSource {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  lat: number;
  lng: number;
}

const BRANCH_SOURCES: BranchSource[] = [
  {
    id: 'main',
    name: 'ChardWorkz Main Branch',
    address: 'Rizal, Antipolo, 1870 Rizal',
    mapsUrl:
      'https://www.google.com/maps/place/chardworkz/@14.6636056,121.2040116,17z/data=!3m1!4b1!4m6!3m5!1s0x3397bc2893a6f589:0x533398376422ecae!8m2!3d14.6636056!4d121.2065919!16s%2Fg%2F11gfhscfv7',
    lat: 14.6636056,
    lng: 121.2065919,
  },
  {
    id: 'masinag',
    name: 'ChardWorkz Masinag Branch',
    address: 'Masinag Marikina-Infanta Hwy, Antipolo, 1870 Rizal',
    mapsUrl:
      'https://www.google.com/maps/place/ChardWorkz+Masinag+Branch/@14.6246116,121.1188928,17z/data=!4m6!3m5!1s0x3397b900067d6d3d:0xe2151b89923873ea!8m2!3d14.6246116!4d121.1188928!16s%2Fg%2F11zx2p4r4p',
    lat: 14.6246116,
    lng: 121.1188928,
  },
];

export interface HoursRow {
  days: string;
  time: string;
}

const HOURS: HoursRow[] = [
  { days: 'Tuesday – Sunday', time: '9:00 AM – 8:00 PM' },
  { days: 'Monday', time: 'Closed' },
];

export interface FaqItem {
  question: string;
  answer: string;
}

/** Draft copy pulled from real service-offer content (services.ts) rather than invented
 *  prices — this repo has no finalized price list yet (see backlog "placeholder catalogue
 *  prices"). Flagged to the user as a draft pending their review before this goes live. */
const FAQS: FaqItem[] = [
  {
    question: 'How much is a PMS (Preventive Maintenance Service)?',
    answer:
      "Depends on which parts need to be replaced during the check-up. Send us your bike's details through the form above or message us directly and we'll give you an accurate quote.",
  },
  {
    question: 'How much is an engine upgrade for the Raider 150 FI?',
    answer:
      "Pricing varies with the parts and level of build you want. Message us with your target setup and we'll walk you through the options and cost.",
  },
  {
    question: 'How much is an overall engine overhaul?',
    answer:
      "Cost depends on the extent of wear and which components need replacing. We'll do a full inspection first before quoting.",
  },
  {
    question: 'What parts and materials do you use?',
    answer:
      'We use trusted, proven parts like SGP performance components and genuine Suzuki Ecstar oils across our services — no shortcuts on quality.',
  },
  {
    question: 'Do I need an appointment, or can I just walk in?',
    answer:
      'Walk-ins are welcome at both branches, but messaging us ahead of time helps us prepare the right parts for your bike.',
  },
  {
    question: 'Which branch should I bring my bike to?',
    answer:
      'Either branch can take your bike — Main Branch and Masinag Branch both run the full ChardWorkz service line-up.',
  },
];

const CONTACT_EMAIL = 'itchi15@yahoo.com';
const CONTACT_PHONE_DISPLAY = '0999 729 8681';
const CONTACT_PHONE_TEL = '+639997298681';

@Component({
  selector: 'app-contact',
  standalone: false,
  styleUrl: './contact.scss',
  templateUrl: './contact.html',
})
export class Contact {
  readonly branches: ContactBranch[];
  readonly hours: HoursRow[] = HOURS;
  readonly faqs: FaqItem[] = FAQS;

  readonly email = CONTACT_EMAIL;
  readonly phoneDisplay = CONTACT_PHONE_DISPLAY;
  readonly phoneTel = CONTACT_PHONE_TEL;

  readonly customerPhoneDisplay = signal('');
  readonly phoneWarning = signal<string | null>(null);
  readonly openFaqIndex = signal<number | null>(0);
  readonly submitted = signal(false);

  constructor(private readonly sanitizer: DomSanitizer) {
    this.branches = BRANCH_SOURCES.map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      mapsUrl: branch.mapsUrl,
      embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.google.com/maps?q=${branch.lat},${branch.lng}&z=16&output=embed`,
      ),
    }));
  }

  onPhoneInput(value: string): void {
    this.customerPhoneDisplay.set(formatPHMobileAsTyped(value));
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.set(this.openFaqIndex() === index ? null : index);
  }

  /** No backend inbox exists yet for this form (see handoff) — submitting opens the
   *  visitor's own email client pre-filled, same stopgap agreed with the user. Phone is
   *  required here (unlike register.ts's optional checkout field) since this is the only
   *  way to reach a visitor back, so an invalid number blocks sending instead of just warning.
   *  Takes the raw elements (not just their .value) so this method — not the template — owns
   *  the branch on whether to clear the form, since Angular template statements can't reliably
   *  express an `if` block around multiple assignments. */
  onSubmit(
    nameEl: HTMLInputElement,
    emailEl: HTMLInputElement,
    messageEl: HTMLTextAreaElement,
  ): void {
    const phoneDigits = this.customerPhoneDisplay().replace(/\s/g, '');
    if (!isValidPHMobileNumber(phoneDigits)) {
      this.phoneWarning.set('Enter a valid phone number.');
      return;
    }
    this.phoneWarning.set(null);

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const message = messageEl.value.trim();
    const body = `Name: ${name || 'N/A'}\nPhone: +63 ${this.customerPhoneDisplay()}\nEmail: ${email || 'N/A'}\n\nMessage:\n${message}`;
    const subject = `Website Inquiry from ${name || 'a visitor'}`;
    window.location.href = `mailto:${this.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    nameEl.value = '';
    emailEl.value = '';
    messageEl.value = '';
    this.customerPhoneDisplay.set('');
    this.submitted.set(true);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
