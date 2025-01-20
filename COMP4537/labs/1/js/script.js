"use strict";

/**
 * When the page loads, create a note manager/updater in read or write mode
 * depending on the page title.
 */
document.addEventListener("DOMContentLoaded", () => {
  fetch("../lang/messages/en/user.json")
    .then((response) => response.json())
    .then((data) => {
      const noteManager = new NoteManager(
        document.title === "Reader" ? null : document.getElementById("add")
      );
      const noteUpdater = new NoteUpdater(
        document.getElementById("timestamp"),
        data,
        noteManager
      );
    });
});

/** @class Note represents a note. */
class Note {
  /**
   * Create a Note either in read-only or write mode. Writeable notes can be
   * edited and removed, read-only ones cannot.
   * @param {Number} id The id of the note.
   * @param {String|null} value The pre-existing value of the node, can be
   * null.
   * @param {Function|null} remove The callback to execute when removing, for
   * writeable notes.
   */
  constructor(id, value, remove) {
    this.id = id;
    this.readonly = remove === null;
    this.html = Object.assign(document.createElement("DIV"), {
      className: "note",
    });
    this.textarea = Object.assign(document.createElement("TEXTAREA"), {
      rows: 3,
      value: value,
      readOnly: this.readonly,
    });
    if (this.readonly) this.html.append(this.textarea);
    else
      // If not read-only, the note needs a remove button.
      this.html.append(
        this.textarea,
        Object.assign(document.createElement("DIV"), {
          className: "button-spacer",
        }),
        Object.assign(document.createElement("BUTTON"), {
          className: "remove",
          innerHTML: "remove",
          onclick: remove,
        })
      );
  }

  /** Append the note to the DOM. */
  append() {
    const notes = document.getElementById("notes");
    if (notes.firstChild) notes.insertBefore(this.html, notes.firstChild);
    else notes.appendChild(this.html);
  }

  /**
   * Remove the note from the DOM. If it is a writeable note, remove it from
   * localStorage as well.
   */
  remove() {
    if (!this.readonly) localStorage.removeItem(this.id);
    this.html.remove();
  }

  /** Write the note to localStorage. */
  write() {
    localStorage.setItem(this.id, this.textarea.value);
  }
}

/** @class NoteManager manages notes. */
class NoteManager {
  /**
   * Create the NoteManager in read-only or write mode. Creates read-only
   * or write notes respectively.
   * @param {HTMLElement|null} add 
   */
  constructor(add) {
    this.readonly = add === null;
    this.notes = {};
    this.refreshNotes();
    if (!this.readonly) add.onclick = () => this.addNote(null, null);
  }

  /**
   * Creates a note and adds it to the DOM.
   * @param {Number|null} key The key for a pre-existing note.
   * @param {String|null} value The value for a pre-existing note.
   */
  addNote(key, value) {
    const id = key || Date.now();
    const newNote = new Note(
      id,
      value,
      this.readonly ? null : () => this.remove(id)
    );
    newNote.append();
    this.notes[id] = newNote;
  }

  /**
   * Removes the note with given ID from the DOM and the internal list.
   * @param {Number} id The ID of the note.
   */
  remove(id) {
    this.notes[id].remove();
    delete this.notes[id];
  }

  /** Writes all notes to localStorage. */
  writeAll() {
    Object.values(this.notes).forEach((note) => note.write());
  }

  /** Pulls an updated list of notes from localStorage. */
  refreshNotes() {
    Object.keys(this.notes).forEach((key) => this.remove(key));
    /* https://stackoverflow.com/questions/17745292/how-to-retrieve-all-localstorage-items-without-knowing-the-keys-in-advance */
    const storage = { ...localStorage };
    Object.entries(storage).forEach(([key, value]) => this.addNote(key, value));
  }

  /**
   * If write mode, writes all notes to localStrage. If read mode, pulls an
   * updated list of notes from localStorage.
   */
  update() {
    this.readonly ? this.refreshNotes() : this.writeAll();
  }

  /**
   * Returns the readonly value.
   * @returns {Boolean} true if this NoteManager is readonly.
   */
  isReadOnly() {
    return this.readonly;
  }
}

/** @class NoteUpdater periodically updates all the notes. */
class NoteUpdater {
  /**
   * Attaches the NoteUpdater to the given element and NoteManager.
   * @param {HTMLElement} elem The element to print timestamps to.
   * @param {Object} data List of user-facing strings.
   * @param {NoteManager} noteManager The NoteManager to update.
   */
  constructor(elem, data, noteManager) {
    this.elem = elem;
    this.data = data;
    this.noteManager = noteManager;
    this.update();
    setInterval(() => this.update(), 2000);
  }

  /** Calls the NoteManager to update and updates the timestamp. */
  update() {
    this.noteManager.update();
    this.updateTime();
  }

  /**
   * ChatGPT assisted with writing this function.
   * Gets the current timestamp in 12H format and prints it to the given
   * element.
   */
  updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? this.data.pm : this.data.am;

    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    const string = this.noteManager.isReadOnly()
      ? this.data.updated
      : this.data.stored;
    this.elem.innerHTML = `${string}${hours}:${minutes}:${seconds}${ampm}`;
  }
}
