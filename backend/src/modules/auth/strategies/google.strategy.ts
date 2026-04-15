import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const backendUrl = (configService.get<string>('BACKEND_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const callbackURL = `${backendUrl}/api/auth/google/callback`;

    console.log('[GoogleStrategy] Initializing...');
    console.log('[GoogleStrategy] BACKEND_URL from config:', backendUrl);
    console.log('[GoogleStrategy] Constructed Callback URL:', callbackURL);
    console.log('[GoogleStrategy] Client ID present:', !!clientId);

    super({
      clientID: clientId || 'mock_client_id',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'mock_client_secret',
      callbackURL: callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const user = await this.authService.validateOAuthUser(profile, 'google');
    done(null, user);
  }
}
