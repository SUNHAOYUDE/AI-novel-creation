import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ok } from "../../common/api-response.js";
import type { CreateTimelineEventDto } from "./dto/create-timeline-event.dto.js";
import type { UpdateTimelineEventDto } from "./dto/update-timeline-event.dto.js";
import { TimelineEventsService } from "./timeline-events.service.js";

@Controller("timeline-events")
export class TimelineEventsController {
  constructor(private readonly timelineEventsService: TimelineEventsService) {}

  @Get()
  async findAll(@Query("bookId") bookId?: string) {
    return ok(await this.timelineEventsService.findAll(bookId ? Number(bookId) : undefined));
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.timelineEventsService.findOne(id));
  }

  @Post()
  async create(@Body() payload: CreateTimelineEventDto) {
    return ok(await this.timelineEventsService.create(payload), "timeline event created");
  }

  @Patch(":id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() payload: UpdateTimelineEventDto) {
    return ok(await this.timelineEventsService.update(id, payload), "timeline event updated");
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return ok(await this.timelineEventsService.remove(id), "timeline event deleted");
  }
}
