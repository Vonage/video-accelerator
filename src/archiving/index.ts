import { ok } from 'node:assert';
import { VideoAccelerator } from '../core';
import { ArchivingEvents } from '../enums';
import { ArchivingOptions } from '../models';
import { dom } from '../util';

export default class ArchivingAccelerator {
  private videoAccelerator?: VideoAccelerator;
  private session: OT.Session;
  private currentArchive?: any;

  constructor(private options: ArchivingOptions) {}

  start = async (): Promise<void> => {
    try {
      const response = await fetch(this.options.startUrl);
      if (response.ok) {
        this.displayModal(response.json());
        this.triggerEvent(ArchivingEvents.ArchiveReady, response.json());
      } else {
        this.triggerEvent(ArchivingEvents.ArchiveError, response.json());
      }
    } catch (err) {
      this.triggerEvent(ArchivingEvents.ArchiveError, err);
    }
  };

  stop = async (): Promise<void> => {
    this.triggerEvent(ArchivingEvents.StopArchive);
    this.displayModal();

    try {
      const response = await fetch(this.options.stopUrl, {
        method: 'POST',
        body: JSON.stringify({ archiveId: this.currentArchive.id })
      });
      if (response.ok) {
        this.displayModal(response.json());
        this.triggerEvent(ArchivingEvents.ArchiveReady, response.json());
      } else {
        this.triggerEvent(ArchivingEvents.ArchiveError, response.json());
      }
    } catch (err) {
      this.triggerEvent(ArchivingEvents.ArchiveError, err);
    }
  };

  /**
   * Displays a modal with the status of the archive.  If no archive object is passed,
   * the 'waiting' modal will be displayed.  If an archive object is passed, the 'ready'
   * modal will be displayed.
   * @param {Object} archive
   */
  displayModal = (archive?: any): void => {
    // Clean up existing modal
    const existingModal = dom.id('accArchivingModal');
    if (existingModal) {
      existingModal.remove();
    }

    const template = archive
      ? this.readyModalTemplate(archive)
      : this.waitingModalTemplate();
    const modalParent = document.querySelector('#otsWidget') || document.body;
    const el = document.createElement('div');
    el.innerHTML = template;

    const modal = el.firstChild;
    modalParent.appendChild(modal);

    const closeModal = document.getElementById('closeArchiveModal');
    const closeModalBtn = document.getElementById('closeArchiveModalBtn');

    closeModal.onclick = () => modal.remove();
    if (closeModalBtn) {
      closeModalBtn.onclick = () => modal.remove();
    }
  };

  private readyModalTemplate = (archive: any): string => {
    const date = new Date(null);
    date.setSeconds(archive.duration);
    const duration = date.toISOString().substr(11, 8);
    const size = `${(archive.size / (1000 * 1000)).toString().slice(0, 5)}mb`;
    return `
      <section id="accArchivingModal" class="acc-archiving-modal">
        <header>
          <h2>Archive is ready</h2>
          <a class="acc-archiving-close"></a>
        </header>
        <main>
          <h3>${archive.id}</h3>
          <div>Archive details: ${duration} / ${size}</div>
        </main>
        <footer>
          <a href="${archive.url}" class="button" target="_blank">Download Archive</a>
        </footer>
      </section>`;
  };

  private waitingModalTemplate = (): string => `
    <section id="accArchivingModal" class="acc-archiving-modal">
      <header>
        <h2>Archive is ready</h2>
        <a class="acc-archiving-close"></a>
      </header>
      <main>
        <p>
          Your session archive file is now being prepared. You'll
          receive a notification as soon as it's ready. Please be
          patient, this won't take long.
        </p>
      </main>
      <footer>
        <a class="button">Ok, Thanks!</a>
      </footer>
    </section>
    `;

  /**
   * Trigger an event and fire all registered callbacks
   * @param event The name of the event
   * @param data Data to be passed to callback functions
   */
  private triggerEvent = (event: string, data?: unknown) => {
    if (this.videoAccelerator) {
      this.videoAccelerator.triggerEvent(event, data);
    }
  };
}
