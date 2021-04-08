import { VideoAccelerator } from '../../core';

export class AnnotationOptions {
  constructor(
    public session: OT.Session,
    public videoAccelerator?: VideoAccelerator,
    public useExternalWindow: boolean = false
  ) {}
}
