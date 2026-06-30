import { Body, Controller, Get, Patch } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { UpdateSystemSettingsDto } from "./dto/system-settings.dto.js";
import { SystemSettingsService } from "./system-settings.service.js";

@Controller("system-settings")
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  async getSettings() {
    return ok(await this.systemSettingsService.getSettings());
  }

  @Patch()
  async updateSettings(@Body() payload: UpdateSystemSettingsDto) {
    return ok(await this.systemSettingsService.updateSettings(payload), "system settings updated");
  }
}
