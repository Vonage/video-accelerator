import { VideoAccelerator } from '../../core';

export class ArchivingOptions {
  constructor(
    public session: OT.Session,
    public startUrl: string,
    public stopUrl: string,
    public appendControl: boolean = true,
    public videoAccelerator?: VideoAccelerator
  ) {}
}
