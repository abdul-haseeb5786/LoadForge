import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const backendUrl = configService.get<string>('BACKEND_URL') || 'http://localhost:3000';
    const callbackURL = `${backendUrl}/api/auth/github/callback`;
    const clientId = configService.get<string>('GITHUB_CLIENT_ID');

    console.log('[GithubStrategy] Initializing...');
    console.log('[GithubStrategy] BACKEND_URL from config:', backendUrl);
    console.log('[GithubStrategy] Constructed Callback URL:', callbackURL);
    console.log('[GithubStrategy] Client ID present:', !!clientId);

    super({
      clientID: clientId || 'mock_client_id',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || 'mock_client_secret',
      callbackURL: callbackURL,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    if (!profile.emails || !profile.emails.length) {
       profile.emails = [{ value: `${profile.username}@github.local` }];
    }
    const user = await this.authService.validateOAuthUser(profile, 'github');
    done(null, user);
  }
}
