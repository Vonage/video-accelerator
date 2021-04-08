import { VideoAccelerator } from '../core';
import { AnnotationOptions } from '../models';

export default class AnnotationAccelerator {
  private videoAccelerator?: VideoAccelerator;
  private session: OT.Session;

  constructor(private options: AnnotationOptions) {}
}
