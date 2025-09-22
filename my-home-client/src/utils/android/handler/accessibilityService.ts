import dsBridge from "dsbridge";
import type { ClickOptions } from "../types/accessibilityService";

export function click(options: ClickOptions) {
  dsBridge.call("accessibilityService.click", options);
}
