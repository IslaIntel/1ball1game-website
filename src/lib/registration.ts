/** Winter Indoor Streetball 2026, $175 per player. Checkout uses the Stripe product price. */
export const FEE_CENTS = 17500;
export const MAX_PLAYERS = 6;

export const SCHOOLS = [
  "Chesterbrook Elementary",
  "Churchill Road Elementary",
  "Cunningham Park Elementary",
  "Freedom Hill Elementary",
  "Haycock Elementary",
  "Kent Gardens Elementary",
  "Lemon Road Elementary",
  "Shrevewood Elementary",
  "Spring Hill Elementary",
  "Stenwood Elementary",
  "Timber Lane Elementary",
  "Westgate Elementary",
  "Other / Private School",
] as const;

export const GRADES = ["Kindergarten", "1st Grade", "2nd Grade"] as const;
export const WINTER_GRADES = ["2nd Grade", "3rd Grade", "4th Grade"] as const;
export const SPRING_GRADES = [
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
] as const;

export const GENDERS = ["Male", "Female", "Prefer not to say"] as const;

export const JERSEY_SIZES = [
  "Youth Extra Small (YXS)",
  "Youth Small (YS)",
  "Youth Medium (YM)",
  "Youth Large (YL)",
  "Youth Extra Large (YXL)",
  "Adult Small (AS)",
  "Adult Medium (AM)",
  "Adult Large (AL)",
  "Adult Extra Large (AXL)",
] as const;

export const RELATIONSHIPS = ["Parent", "Legal Guardian", "Other"] as const;

export const VOLUNTEER_ROLES = [
  "Yes, Head Coach",
  "Yes, Assistant Coach",
  "No, not at this time",
] as const;

/** Display labels shown in the volunteer dropdown (stored value stays in VOLUNTEER_ROLES). */
export const VOLUNTEER_ROLE_LABELS: Record<(typeof VOLUNTEER_ROLES)[number], string> = {
  "Yes, Head Coach":
    "Yes, Head Coach — 50% registration refund if selected for the role",
  "Yes, Assistant Coach":
    "Yes, Assistant Coach — 20% registration refund if selected for the role",
  "No, not at this time": "No, not at this time",
};

export const ADULT_SHIRT_SIZES = [
  "Adult S",
  "Adult M",
  "Adult L",
  "Adult XL",
  "Adult XXL",
  "Adult XXXL",
] as const;

export const STEP_LABELS = [
  "Parent Info",
  "Players",
  "Medical",
  "Waivers",
  "Review",
] as const;

export const STEP_TITLES = [
  "Parent / guardian information",
  "Tell us about your player",
  "Medical & emergency information",
  "Review and acknowledge",
  "Confirm & pay",
] as const;

/** Spring collects no payment, so its last step is just "Confirm". */
export const SPRING_STEP_TITLES = [...STEP_TITLES.slice(0, 4), "Confirm"] as const;

export const STEP_DESCRIPTIONS = [
  "We collect this once, even when you register multiple siblings.",
  "Register one player or add siblings to the same registration.",
  "Provide a separate emergency contact and medical response for each player.",
  "Open each section and select every acknowledgment before continuing.",
  "Review your details, then pay or apply a scholarship code to register.",
] as const;

/** Registration total in cents from player count (server-side source of truth). */
export function registrationTotalCents(playerCount: number, unitAmountCents = FEE_CENTS) {
  return playerCount * unitAmountCents;
}

export const PTA_RETURN_RATE = 0.75;

/** PTA portion of registration total (75% back to school). */
export function ptaReturnCents(totalCents: number) {
  return Math.round(totalCents * PTA_RETURN_RATE);
}

export type ParentInfo = {
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  secondaryName: string;
  secondaryPhone: string;
  secondaryEmail: string;
};

export type PlayerInfo = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  school: string;
  buddyRequest: string;
  jerseySize: string;
  emergencyContactName: string;
  emergencyPhone: string;
  hasMedicalConditions: "" | "yes" | "no";
  medicalDetails: string;
};

export type VolunteerInfo = {
  role: string;
  name: string;
  shirtSize: string;
};

export type WaiverKey =
  | "programAdministration"
  | "liabilityRelease"
  | "photoMedia"
  | "codeOfConduct"
  | "fundraisingAgreement";

export type Waivers = Record<WaiverKey, boolean>;

export type RegistrationPayload = {
  parent: ParentInfo;
  players: PlayerInfo[];
  volunteer: VolunteerInfo;
  waivers: Waivers;
  parentSignature: string;
  /** Set when the family chooses a season. Omitted on older in-flight checkouts. */
  season?: string;
};

export const emptyParent = (): ParentInfo => ({
  firstName: "",
  lastName: "",
  relationship: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "VA",
  zip: "",
  secondaryName: "",
  secondaryPhone: "",
  secondaryEmail: "",
});

export const emptyPlayer = (): PlayerInfo => ({
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  grade: "",
  school: "",
  buddyRequest: "",
  jerseySize: "",
  emergencyContactName: "",
  emergencyPhone: "",
  hasMedicalConditions: "",
  medicalDetails: "",
});

export const emptyVolunteer = (): VolunteerInfo => ({
  role: "",
  name: "",
  shirtSize: "",
});

export const emptyWaivers = (): Waivers => ({
  programAdministration: false,
  liabilityRelease: false,
  photoMedia: false,
  codeOfConduct: false,
  fundraisingAgreement: false,
});

export type WaiverDoc = {
  key: WaiverKey;
  title: string;
  affirmation: string;
  sections: { heading: string; body: string }[];
  note?: string;
};

/** Waivers written for the school PTA program. Spring uses these; Winter adapts them below. */
const PTA_WAIVERS: WaiverDoc[] = [
  {
    key: "liabilityRelease",
    title: "Comprehensive Liability Waiver, Release & Indemnity Agreement",
    affirmation:
      "I have read, understood, and explicitly agree to the Liability and Indemnity Agreement.",
    sections: [
      {
        heading: "Full Release and Covenant Not to Sue:",
        body: "In consideration of being allowed to participate, I, on behalf of myself, my minor child (the Participant), and our respective heirs, executors, administrators, and assigns, hereby fully and forever release, waive, acquit, discharge, and covenant not to sue the 1 Ball 1 Game Foundation, its founders, officers, directors, administrators, coordinators, and sponsors (collectively, the “1B1G Released Parties”), from any and all liability, claims, demands, actions, or causes of action whatsoever, arising out of or related to any loss, damage, illness, injury, or death that may be sustained by the Participant or the undersigned while participating in, observing, or traveling to/from activities managed by the School PTA Soccer Club.",
      },
      {
        heading: "Assumption of Risk & Indemnification:",
        body: "I agree that this release applies to any and all claims, including those caused by the ordinary negligence or fault of the 1B1G Released Parties, whether active or passive, regarding the educational modules or equipment provided. I further agree to indemnify, defend, and hold harmless the 1B1G Released Parties from any and all claims, actions, suits, procedures, costs, expenses, damages, and liabilities, including reasonable attorney’s fees, brought as a result of the Participant’s involvement or presence at school-operated soccer events.",
      },
    ],
  },
  {
    key: "photoMedia",
    title: "Community Photo & Media Sharing Agreement",
    affirmation:
      "I agree to the community photo sharing terms to support program updates and local promotion.",
    sections: [
      {
        heading: "Purpose of Media:",
        body: "We love celebrating the kids’ development and sharing match-day smiles with our community! I grant permission for the 1 Ball 1 Game Foundation (1B1G) and my school’s PTA Soccer Club to utilize photographs or video recordings taken during recreational matches, practices, and events.",
      },
      {
        heading: "Where Images Are Used:",
        body: "These materials will be used strictly for positive, community-focused purposes, including the 1B1G website, program newsletters, local school promotional materials, and official social media channels.",
      },
      {
        heading: "Protection Guarantee:",
        body: "1B1G explicitly agrees that these images will never be sold, commercialized, or distributed to third-party advertisers. I understand that these materials are shared without financial compensation, and I can contact program coordinators at any time if a specific photo needs to be removed for privacy reasons.",
      },
    ],
  },
  {
    key: "codeOfConduct",
    title: "Zero-Tolerance Code of Conduct & Termination Agreement",
    affirmation:
      "I acknowledge and agree to abide by the Zero-Tolerance Code of Conduct and accept the termination terms.",
    sections: [
      {
        heading: "Why this matters:",
        body: "The 1 Ball 1 Game Foundation is established purely for the positive, recreational, and instructional development of Kindergarten through 6th Grade children. To protect the safety, emotional well-being, and positive environment of our participants and volunteer staff, 1B1G enforces a strict Zero-Tolerance Policy regarding sideline misconduct.",
      },
      {
        heading: "Prohibited Behavior:",
        body: "Any parent, guardian, spectator, or guest who engages in aggressive, hostile, disparaging, or profane language or behavior directed at volunteer coaches, field coordinators, opposing players, or children will be immediately and permanently banned from all field locations.",
      },
      {
        heading: "Right to Terminate:",
        body: "1B1G reserves the absolute right, in its sole discretion, to terminate a player’s registration and participation immediately, without warning and without refund, if a parent, guardian, or guest violates this agreement. By checking below, I accept full responsibility for the conduct of all family members and guests attending 1B1G events.",
      },
    ],
  },
  {
    key: "fundraisingAgreement",
    title: "Fundraising Financial Agreement & Non-Refundable Acknowledgment",
    affirmation:
      "I acknowledge the fundraising financial policy and agree that all fees are strictly non-refundable.",
    sections: [
      {
        heading: "How your registration supports the program:",
        body: "I understand and agree that the 1 Ball 1 Game Foundation (1B1G) acts as a fundraising processing partner for the School PTA Soccer Club, and that 1B1G’s involvement is strictly limited to providing complimentary soccer coaching modules, curriculum guides, and equipment to the parent volunteers selected by the PTA. I acknowledge that all funds collected are committed immediately to the foundation’s general fundraising and operational oversight pools.",
      },
      {
        heading: "Waiver of Chargebacks and Refunds:",
        body: "I explicitly agree that to ensure maximum fundraising for my school, all fees are strictly non-refundable. I hereby waive any right to dispute, initiate a chargeback, or request a refund from 1B1G, its bank processors, founders, or directors for any reason, including the full or partial cancellation of the soccer season by the operating PTA or school facility.",
      },
    ],
    note: "The registration fee collected through this portal is processed by 1B1G in its capacity as a fundraising partner for your school’s PTA Soccer Club. All registration fees and fundraising contributions are strictly non-refundable, including in cases of player withdrawal, scheduling conflicts, injury, weather, field closures, or decisions made by the school administration or operating PTA.",
  },
  {
    key: "programAdministration",
    title: "Program Administration & Facility Partnership",
    affirmation:
      "I have read, understood, and agree to the Program Administration & Facility Partnership terms, authorizing 1B1G and Surf Nation/Va Surf as the designated league and facility administrators.",
    sections: [
      {
        heading: "",
        body: "I understand and agree that this program operates as a community youth soccer co-sponsored by our local elementary school PTA and administered by 1 Ball 1 Game (1B1G) in affiliation with McLean Surf.",
      },
      {
        heading: "",
        body: "I acknowledge that 1B1G and Surf Nation/VaSurf serve as the authorized league administrators responsible for operational oversight, volunteer coach onboarding, technical curriculum, and facility scheduling. By completing this registration, I authorize 1B1G and Surf Nation/VaSurf to register our participation and submit required team rosters to Fairfax County Neighborhood and Community Services (NCS) and Fairfax County Public Schools (FCPS) for athletic field allocations and facility permits.",
      },
      {
        heading: "",
        body: "I understand that enrollment provides our family access to 1B1G developmental soccer curriculum, team equipment, and affiliated training resources supporting our community volunteer coaches and weekly match play.",
      },
    ],
  },
];

/** Spring omits the photo and fundraising waivers. */
export const SPRING_WAIVERS: WaiverDoc[] = PTA_WAIVERS.filter(
  (waiver) => waiver.key !== "photoMedia" && waiver.key !== "fundraisingAgreement",
);

/**
 * Winter Streetball is indoor soccer at Lemon Road Elementary Gym run by
 * professional coaches, so its waivers describe that program instead of the
 * PTA season. Each pair is [text in the PTA waiver, Winter replacement].
 */
const WINTER_WAIVER_WORDING: [string, string][] = [
  [
    "activities managed by the School PTA Soccer Club.",
    "activities of the Winter Streetball indoor soccer program at Lemon Road Elementary Gym.",
  ],
  ["presence at school-operated soccer events.", "presence at Winter Streetball sessions."],
  [
    "and my school’s PTA Soccer Club to utilize photographs or video recordings taken during recreational matches, practices, and events.",
    "to utilize photographs or video recordings taken during Winter Streetball sessions and events.",
  ],
  ["Kindergarten through 6th Grade children.", "2nd through 4th Grade children."],
  ["our participants and volunteer staff,", "our participants and coaching staff,"],
  ["regarding sideline misconduct.", "regarding spectator misconduct."],
  [
    "directed at volunteer coaches, field coordinators, opposing players, or children will be immediately and permanently banned from all field locations.",
    "directed at coaches, program staff, opposing players, or children will be immediately and permanently banned from all program locations.",
  ],
];

function toWinterWording(text: string) {
  return WINTER_WAIVER_WORDING.reduce((out, [from, to]) => out.replace(from, to), text);
}

/** Winter Streetball waivers (the paid registration). */
export const WAIVERS: WaiverDoc[] = PTA_WAIVERS.map((waiver) => ({
  ...waiver,
  sections: waiver.sections.map((section) => ({
    ...section,
    body: toWinterWording(section.body),
  })),
}));

export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function isVolunteering(role: string) {
  return Boolean(role) && role !== "No, not at this time";
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidPhone(value: string) {
  return phoneDigits(value).length >= 10;
}

export function isValidEmail(value: string) {
  const trimmed = value.trim();
  return trimmed.includes("@") && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export type FieldErrors = Record<string, string>;

export function validateStep(
  step: number,
  data: RegistrationPayload,
  waiverDocs: readonly WaiverDoc[] = WAIVERS,
): FieldErrors {
  const errors: FieldErrors = {};
  const { parent, players, waivers } = data;

  if (step === 0) {
    if (!parent.firstName.trim())
      errors["parent.firstName"] = "Enter the parent/guardian’s first name.";
    if (!parent.lastName.trim())
      errors["parent.lastName"] = "Enter the parent/guardian’s last name.";
    if (!parent.relationship)
      errors["parent.relationship"] = "Choose the relationship to the player.";
    if (!parent.email.trim() || !isValidEmail(parent.email))
      errors["parent.email"] = "Enter a valid email address with an @ symbol.";
    if (!parent.phone.trim())
      errors["parent.phone"] = "Enter a primary phone number.";
    else if (!isValidPhone(parent.phone))
      errors["parent.phone"] = "Enter a phone number with at least 10 digits.";
    if (parent.secondaryPhone.trim() && !isValidPhone(parent.secondaryPhone))
      errors["parent.secondaryPhone"] =
        "Enter a phone number with at least 10 digits.";
    if (
      parent.secondaryEmail.trim() &&
      !isValidEmail(parent.secondaryEmail)
    )
      errors["parent.secondaryEmail"] =
        "Enter a valid email address with an @ symbol.";
    if (!parent.street.trim()) errors["parent.street"] = "Enter a street address.";
    if (!parent.city.trim()) errors["parent.city"] = "Enter a city.";
    if (!parent.state.trim()) errors["parent.state"] = "Enter a state.";
    if (!parent.zip.trim()) errors["parent.zip"] = "Enter a ZIP code.";
  }

  if (step === 1) {
    if (players.length > MAX_PLAYERS) {
      errors.players = `You can register up to ${MAX_PLAYERS} players at a time.`;
    }
    players.forEach((player, i) => {
      if (!player.firstName.trim())
        errors[`players.${i}.firstName`] = "Enter the player’s first name.";
      if (!player.lastName.trim())
        errors[`players.${i}.lastName`] = "Enter the player’s last name.";
      if (!player.dateOfBirth)
        errors[`players.${i}.dateOfBirth`] = "Enter a date of birth.";
      if (!player.gender) errors[`players.${i}.gender`] = "Choose a gender option.";
      if (!player.grade) errors[`players.${i}.grade`] = "Choose a grade.";
      if (!player.school) errors[`players.${i}.school`] = "Choose a school.";
      if (!player.jerseySize)
        errors[`players.${i}.jerseySize`] = "Choose a jersey size.";
    });
  }

  if (step === 2) {
    players.forEach((player, i) => {
      if (!player.emergencyContactName.trim())
        errors[`players.${i}.emergencyContactName`] =
          "Enter an emergency contact name.";
      if (!player.emergencyPhone.trim())
        errors[`players.${i}.emergencyPhone`] = "Enter an emergency phone number.";
      else if (!isValidPhone(player.emergencyPhone))
        errors[`players.${i}.emergencyPhone`] =
          "Enter a phone number with at least 10 digits.";
      if (
        player.emergencyContactName.trim() &&
        parent.firstName.trim() &&
        parent.lastName.trim() &&
        player.emergencyContactName.trim().toLowerCase() ===
          `${parent.firstName} ${parent.lastName}`.trim().toLowerCase()
      ) {
        errors[`players.${i}.emergencyContactName`] =
          "Must be different from the primary parent/guardian.";
      }
      if (!player.hasMedicalConditions)
        errors[`players.${i}.hasMedicalConditions`] = "Choose Yes or No.";
      if (
        player.hasMedicalConditions === "yes" &&
        !player.medicalDetails.trim()
      ) {
        errors[`players.${i}.medicalDetails`] =
          "Please describe allergies or medical conditions.";
      }
    });
  }

  if (step === 3) {
    for (const waiver of waiverDocs) {
      if (!waivers[waiver.key]) {
        errors[`waivers.${waiver.key}`] = "This acknowledgment is required.";
      }
    }
    if (Object.keys(errors).length) {
      errors.waivers = `${waiverDocs.length} individual acknowledgments are required.`;
    }
  }

  if (step === 4) {
    if (!data.parentSignature?.trim()) {
      errors.parentSignature = "Type your full name to sign before submitting.";
    }
  }

  return errors;
}

/** Spring 2027: parent contact plus player details. No address, waivers, or payment. */
export function validateSpringRegistration(data: RegistrationPayload): FieldErrors {
  const errors: FieldErrors = {};
  const { parent, players } = data;

  if (!parent.firstName.trim())
    errors["parent.firstName"] = "Enter the parent/guardian’s first name.";
  if (!parent.lastName.trim())
    errors["parent.lastName"] = "Enter the parent/guardian’s last name.";
  if (!parent.relationship)
    errors["parent.relationship"] = "Choose the relationship to the player.";
  if (!parent.email.trim() || !isValidEmail(parent.email))
    errors["parent.email"] = "Enter a valid email address with an @ symbol.";
  if (!parent.phone.trim())
    errors["parent.phone"] = "Enter a primary phone number.";
  else if (!isValidPhone(parent.phone))
    errors["parent.phone"] = "Enter a phone number with at least 10 digits.";

  if (players.length < 1) {
    errors.players = "Add at least one player.";
  }
  if (players.length > MAX_PLAYERS) {
    errors.players = `You can register up to ${MAX_PLAYERS} players at a time.`;
  }

  players.forEach((player, i) => {
    if (!player.firstName.trim())
      errors[`players.${i}.firstName`] = "Enter the player’s first name.";
    if (!player.lastName.trim())
      errors[`players.${i}.lastName`] = "Enter the player’s last name.";
    if (!player.dateOfBirth)
      errors[`players.${i}.dateOfBirth`] = "Enter a date of birth.";
    if (!player.gender) errors[`players.${i}.gender`] = "Choose a gender option.";
    if (!player.grade) errors[`players.${i}.grade`] = "Choose a grade.";
    if (!player.school) errors[`players.${i}.school`] = "Choose a school.";
    if (!player.jerseySize)
      errors[`players.${i}.jerseySize`] = "Choose a jersey size.";
  });

  return errors;
}
