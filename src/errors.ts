export class OauthError extends Error {
  error: string
  error_description: string

  constructor (status: number, error: string, error_description: string) {
    super(error_description)

    this.status = status
    this.error = error
    this.error_description = error_description
  }

  toResponse() {
    return {
      status: this.status,
      body: {
        error: this.error,
        error_description: this.error_description
      }
    }
  }
}
