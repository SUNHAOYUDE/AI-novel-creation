import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { JwtAuthGuard } from "./modules/auth/jwt-auth.guard.js";
import { BackstoriesModule } from "./modules/backstories/backstories.module.js";
import { BooksModule } from "./modules/books/books.module.js";
import { ChaptersModule } from "./modules/chapters/chapters.module.js";
import { CharactersModule } from "./modules/characters/characters.module.js";
import { EconomyEntriesModule } from "./modules/economy-entries/economy-entries.module.js";
import { ForeshadowsModule } from "./modules/foreshadows/foreshadows.module.js";
import { OutlinesModule } from "./modules/outlines/outlines.module.js";
import { SystemSettingsModule } from "./modules/system-settings/system-settings.module.js";
import { TimelineEventsModule } from "./modules/timeline-events/timeline-events.module.js";
import { WorldMapsModule } from "./modules/world-maps/world-maps.module.js";
import { defaultProviders } from "./providers/default.providers.js";

@Module({
  imports: [AuthModule, SystemSettingsModule, BooksModule, AuditLogsModule, BackstoriesModule, WorldMapsModule, TimelineEventsModule, EconomyEntriesModule, CharactersModule, OutlinesModule, ForeshadowsModule, ChaptersModule],
  providers: [
    ...defaultProviders,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    }
  ]
})
export class AppModule {}
