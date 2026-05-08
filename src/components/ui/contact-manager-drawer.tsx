"use client";

/* ═══════════════════════════════════════════════════════════════
   ContactManagerDrawer — multi-contact CRUD per party

   Master/detail layout:
     LEFT  · scrollable list of all parties from RECEIVABLES, with
             a count badge per party showing #contacts
     RIGHT · selected party's contact list with inline add/edit

   Contact fields: name · phone · email · designation · role
                   isPrimary · receivesReminders

   Default behavior is intentionally conservative:
   - The Tally-imported primary stays primary unless the user
     explicitly hands the badge to another contact.
   - Adding a new contact defaults to receivesReminders=true so
     the user doesn't have to remember a second toggle.

   Backed by an in-memory mirror of PARTY_CONTACTS — no persistence
   in the prototype. Saves live for the session only.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Plus,
  Search,
  Phone,
  Mail,
  Trash2,
  Star,
  Check,
} from "lucide-react";
import {
  RECEIVABLES,
  PARTY_CONTACTS,
  CONTACT_ROLE_LABELS,
  CONTACT_ROLE_COLORS,
  type PartyContact,
  type PartyContactPerson,
  type ContactRole,
} from "@/lib/data";

const ROLE_OPTIONS: ContactRole[] = [
  "owner", "accounting", "finance", "purchase", "operations", "sales", "other",
];

interface ContactManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Optional: pre-select a specific party when opened from a row context. */
  initialParty?: string;
}

export function ContactManagerDrawer({ open, onClose, initialParty }: ContactManagerDrawerProps) {
  // Working copy of contacts (mirror PARTY_CONTACTS) — edits stay session-local.
  const [parties, setParties] = useState<Record<string, PartyContactPerson[]>>(() => {
    const map: Record<string, PartyContactPerson[]> = {};
    for (const r of RECEIVABLES) {
      const found = PARTY_CONTACTS.find((p) => p.partyName === r.name);
      map[r.name] = found ? [...found.contacts] : [];
    }
    return map;
  });
  const [selectedParty, setSelectedParty] = useState<string>(
    initialParty ?? RECEIVABLES[0]?.name ?? "",
  );
  const [search, setSearch] = useState("");

  // Reset selection on open
  useEffect(() => {
    if (open) {
      setSelectedParty(initialParty ?? RECEIVABLES[0]?.name ?? "");
      setSearch("");
    }
  }, [open, initialParty]);

  const filteredParties = useMemo(
    () =>
      RECEIVABLES.filter((r) =>
        !search.trim() || r.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const currentContacts = parties[selectedParty] ?? [];

  /* ── Mutations (session-local) ── */
  const addContact = () => {
    const newContact: PartyContactPerson = {
      id: `c-${selectedParty.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
      name: "",
      phone: "",
      email: "",
      designation: "",
      role: "accounting",
      isPrimary: currentContacts.length === 0,
      receivesReminders: true,
      source: "manual",
    };
    setParties((prev) => ({
      ...prev,
      [selectedParty]: [...(prev[selectedParty] ?? []), newContact],
    }));
  };

  const updateContact = (id: string, patch: Partial<PartyContactPerson>) => {
    setParties((prev) => {
      const list = prev[selectedParty] ?? [];
      // Setting isPrimary on one contact unsets it on the others
      const next = list.map((c) =>
        c.id === id ? { ...c, ...patch } : patch.isPrimary ? { ...c, isPrimary: false } : c,
      );
      return { ...prev, [selectedParty]: next };
    });
  };

  const removeContact = (id: string) => {
    setParties((prev) => {
      const list = (prev[selectedParty] ?? []).filter((c) => c.id !== id);
      // If we removed the primary, promote the first remaining contact
      if (list.length > 0 && !list.some((c) => c.isPrimary)) {
        list[0] = { ...list[0], isPrimary: true };
      }
      return { ...prev, [selectedParty]: list };
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70]"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-4xl rounded-lg overflow-hidden pointer-events-auto flex flex-col"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                maxHeight: "92vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--text-1)" }}>
                    Manage party contacts
                  </h3>
                  <p className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
                    Add multiple contacts per customer · tag roles · pick who receives reminders
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-md cursor-pointer"
                  style={{ color: "var(--text-3)" }}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body — master/detail */}
              <div className="flex-1 flex flex-col md:flex-row min-h-0">
                {/* Master — party list */}
                <aside
                  className="flex-shrink-0 flex flex-col"
                  style={{
                    width: "100%",
                    maxWidth: 280,
                    borderRight: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <Search size={12} style={{ color: "var(--text-4)" }} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search parties"
                      className="bg-transparent text-[11.5px] outline-none flex-1 min-w-0"
                      style={{ color: "var(--text-1)" }}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto py-1">
                    {filteredParties.map((r) => {
                      const list = parties[r.name] ?? [];
                      const active = selectedParty === r.name;
                      const hasContact = list.length > 0;
                      return (
                        <button
                          key={r.name}
                          onClick={() => setSelectedParty(r.name)}
                          className="w-full text-left px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                          style={{
                            background: active ? "var(--bg-hover)" : "transparent",
                            borderLeft: active ? "2px solid var(--green)" : "2px solid transparent",
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[11.5px] font-semibold truncate"
                              style={{
                                color: active ? "var(--text-1)" : "var(--text-2)",
                              }}
                            >
                              {r.name}
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
                              {hasContact ? `${list.length} contact${list.length === 1 ? "" : "s"}` : "No contacts"}
                            </p>
                          </div>
                          <span
                            className="text-[9.5px] tabular-nums px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{
                              background: hasContact
                                ? "color-mix(in srgb, var(--green) 14%, transparent)"
                                : "color-mix(in srgb, var(--orange) 14%, transparent)",
                              color: hasContact ? "var(--green)" : "var(--orange)",
                            }}
                          >
                            {list.length}
                          </span>
                        </button>
                      );
                    })}
                    {filteredParties.length === 0 && (
                      <p className="text-[11px] text-center py-6" style={{ color: "var(--text-4)" }}>
                        No parties match
                      </p>
                    )}
                  </div>
                </aside>

                {/* Detail — selected party's contacts */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold truncate" style={{ color: "var(--text-1)" }}>
                        {selectedParty}
                      </p>
                      <p className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
                        {currentContacts.length === 0
                          ? "No contacts yet — add the first to enable reminders for this party."
                          : `${currentContacts.length} contact${currentContacts.length === 1 ? "" : "s"} · ${currentContacts.filter((c) => c.receivesReminders).length} receive reminders`}
                      </p>
                    </div>
                    <button
                      onClick={addContact}
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-md cursor-pointer flex-shrink-0"
                      style={{ background: "var(--green)", color: "#fff" }}
                    >
                      <Plus size={12} /> Add contact
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
                    {currentContacts.length === 0 && (
                      <div
                        className="rounded-md p-6 text-center"
                        style={{
                          background: "color-mix(in srgb, var(--orange) 6%, transparent)",
                          border: "1px dashed color-mix(in srgb, var(--orange) 30%, transparent)",
                        }}
                      >
                        <p className="text-[12px] font-semibold" style={{ color: "var(--orange)" }}>
                          No contacts captured
                        </p>
                        <p className="text-[10.5px] mt-1" style={{ color: "var(--text-3)" }}>
                          Reminders won&apos;t fire for this party until at least one contact is added.
                        </p>
                      </div>
                    )}

                    {currentContacts.map((c) => (
                      <ContactCard
                        key={c.id}
                        contact={c}
                        onUpdate={(patch) => updateContact(c.id, patch)}
                        onRemove={() => removeContact(c.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between gap-3 px-5 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <p className="text-[10.5px]" style={{ color: "var(--text-4)" }}>
                  Changes apply to the next cron run · primary contact gets the reminder by default
                </p>
                <button
                  onClick={onClose}
                  className="text-[12px] font-semibold px-4 py-1.5 rounded-md cursor-pointer"
                  style={{ background: "var(--green)", color: "#fff" }}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ContactCard — one contact's edit row (inline, all fields visible)
   ══════════════════════════════════════════════════════════════════ */
function ContactCard({
  contact,
  onUpdate,
  onRemove,
}: {
  contact: PartyContactPerson;
  onUpdate: (patch: Partial<PartyContactPerson>) => void;
  onRemove: () => void;
}) {
  const roleColor = CONTACT_ROLE_COLORS[contact.role];

  return (
    <div
      className="rounded-md p-3 flex flex-col gap-2.5"
      style={{
        background: contact.isPrimary
          ? "color-mix(in srgb, var(--green) 4%, var(--bg-primary))"
          : "var(--bg-primary)",
        border: contact.isPrimary
          ? "1px solid color-mix(in srgb, var(--green) 35%, transparent)"
          : "1px solid var(--border)",
      }}
    >
      {/* Header row — primary star + role pill + remove */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onUpdate({ isPrimary: true })}
            disabled={contact.isPrimary}
            title={contact.isPrimary ? "Primary contact" : "Make primary"}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer disabled:cursor-default"
            style={{
              background: contact.isPrimary
                ? "color-mix(in srgb, var(--green) 14%, transparent)"
                : "transparent",
              color: contact.isPrimary ? "var(--green)" : "var(--text-4)",
              border: contact.isPrimary
                ? "1px solid transparent"
                : "1px solid var(--border)",
            }}
          >
            <Star size={10} fill={contact.isPrimary ? "currentColor" : "none"} />
            {contact.isPrimary ? "Primary" : "Make primary"}
          </button>

          <RoleSelector
            role={contact.role}
            onChange={(role) => onUpdate({ role })}
            color={roleColor}
          />

          {contact.optedOut && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: "color-mix(in srgb, var(--red) 14%, transparent)",
                color: "var(--red)",
              }}
              title="Replied STOP — opted out of reminders"
            >
              Opted out
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Receives toggle */}
          <label
            className="flex items-center gap-1.5 text-[10.5px] cursor-pointer"
            style={{ color: contact.receivesReminders ? "var(--text-2)" : "var(--text-4)" }}
          >
            <input
              type="checkbox"
              checked={contact.receivesReminders}
              onChange={(e) => onUpdate({ receivesReminders: e.target.checked })}
              className="cursor-pointer"
            />
            Receives reminders
          </label>
          <button
            onClick={onRemove}
            title="Remove contact"
            className="p-1 rounded cursor-pointer"
            style={{ color: "var(--text-4)" }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Editable fields — name + designation on row 1, phone + email on row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field
          label="Name"
          value={contact.name}
          onChange={(v) => onUpdate({ name: v })}
          placeholder="e.g. Amit Mehra"
        />
        <Field
          label="Designation"
          value={contact.designation ?? ""}
          onChange={(v) => onUpdate({ designation: v })}
          placeholder="e.g. Director"
        />
        <Field
          label="Phone"
          value={contact.phone ?? ""}
          onChange={(v) => onUpdate({ phone: v })}
          placeholder="+91 98XXX XXXXX"
          icon={<Phone size={11} />}
        />
        <Field
          label="Email"
          value={contact.email ?? ""}
          onChange={(v) => onUpdate({ email: v })}
          placeholder="name@company.com"
          icon={<Mail size={11} />}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9.5px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-4)" }}>
        {label}
      </span>
      <div
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {icon && <span style={{ color: "var(--text-4)" }}>{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent text-[11.5px] outline-none flex-1 min-w-0"
          style={{ color: "var(--text-1)" }}
        />
      </div>
    </label>
  );
}

function RoleSelector({
  role,
  onChange,
  color,
}: {
  role: ContactRole;
  onChange: (role: ContactRole) => void;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer"
        style={{
          background: `color-mix(in srgb, ${color} 14%, transparent)`,
          color,
        }}
      >
        {CONTACT_ROLE_LABELS[role]}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 mt-1 z-[101] flex flex-col rounded-md py-1 min-w-[120px]"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
              }}
            >
              {ROLE_OPTIONS.map((r) => {
                const c = CONTACT_ROLE_COLORS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onChange(r);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] cursor-pointer text-left"
                    style={{
                      color: r === role ? c : "var(--text-2)",
                      fontWeight: r === role ? 700 : 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {CONTACT_ROLE_LABELS[r]}
                    {r === role && <Check size={11} />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
