import { Controller, Get, Delete, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  findAll(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = req.user?._id?.toString() || req.user?.id;
    return this.historyService.findAll(userId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?._id?.toString() || req.user?.id;
    return this.historyService.findOne(id, userId);
  }

  @Patch(':id/name')
  updateName(@Param('id') id: string, @Body('name') name: string, @Req() req: any) {
    const userId = req.user?._id?.toString() || req.user?.id;
    return this.historyService.updateName(id, userId, name);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?._id?.toString() || req.user?.id;
    return this.historyService.remove(id, userId);
  }
}
