/**
 * Video API Credentials
 */
export class Credential {
  constructor(
    /**
     * Video API key
     */
    public apiKey: string,
    /**
     * Unique identifier for the Video API session
     * @see https://tokbox.com/developer/guides/basics/#sessions
     */
    public sessionId: string,
    /**
     * Authentication token for the user joining the session
     * @see https://tokbox.com/developer/guides/basics/#token
     */
    public token: string
  ) {}
}
