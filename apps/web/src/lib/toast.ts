import { sileo, type SileoOptions } from 'sileo';

export const toast = {
  success: (msg: string | SileoOptions) =>
    typeof msg === 'string' ? sileo.success({ title: msg }) : sileo.success(msg),
  error: (msg: string | SileoOptions) =>
    typeof msg === 'string' ? sileo.error({ title: msg }) : sileo.error(msg),
  warning: (msg: string | SileoOptions) =>
    typeof msg === 'string' ? sileo.warning({ title: msg }) : sileo.warning(msg),
  info: (msg: string | SileoOptions) =>
    typeof msg === 'string' ? sileo.info({ title: msg }) : sileo.info(msg),
};
