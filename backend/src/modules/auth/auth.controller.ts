import { Controller, Get, Post, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const { access_token } = await this.authService.generateToken(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: any, @Res() res: any) {
    const { access_token } = await this.authService.generateToken(req.user);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Req() req: any) {
    return req.user;
  }

  @Post('logout')
  logout(@Res() res: any) {
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
