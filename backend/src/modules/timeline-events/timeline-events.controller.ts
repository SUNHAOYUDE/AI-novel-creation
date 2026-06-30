import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import { CurrentUser } from "../auth/current-user.decorator.js";
import type { AuthUser } from "../auth/auth.types.js";
import type { CreateTimelineEventDto } from "./dto/create-timeline-event.dto.js";
import type { UpdateTimelineEventDto } from "./dto/update-timeline-event.dto.js";
import { TimelineEventsService } from "./timeline-events.service.js";

@Controller("timeline-events")
export class TimelineEventsController {
  constructor(private readonly timelineEventsService: TimelineEventsService) {}

  @Get()
  async findAll(@Query("bookId") bookId: string | undefined, @CurrentUser() user?: AuthUser) {
    return ok(await this.timelineEventsService.findAll(user?.id ?? 0, bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.timelineEventsService.findOne(user?.id ?? 0, id));
  }

  @Post()
  async create(@Body() payload: CreateTimelineEventDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.timelineEventsService.create(user?.id ?? 0, payload), "timeline event created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateTimelineEventDto, @CurrentUser() user?: AuthUser) {
    return ok(await this.timelineEventsService.update(user?.id ?? 0, id, payload), "timeline event updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user?: AuthUser) {
    return ok(await this.timelineEventsService.remove(user?.id ?? 0, id), "timeline event deleted");
  }
}
