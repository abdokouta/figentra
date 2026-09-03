/**
 * @file terraform-runner.ts
 * @description Cloudflare Container class for isolated Terraform execution.
 *
 * The container has no public HTTP route. The only supported operation is the
 * fixed `/entrypoint.sh` executable, and all arguments are passed through
 * environment variables established by the authenticated orchestrator.
 */
import { Container } from '@cloudflare/containers';

/**
 * Isolated Terraform runner container.
 */
export class TerraformRunner extends Container {
  /** Default diagnostic port; Terraform itself does not expose a public API. */
  override defaultPort = 8080;
  /** Retain the runner briefly between workflow operations. */
  override sleepAfter = '10m';
  /** Terraform needs outbound provider access, but only to approved hosts. */
  override enableInternet = true;
  /** Provider/Git hosts required by the current Terraform stack. */
  override allowedHosts = [
    'github.com', '*.github.com',
    'registry.terraform.io', '*.terraform.io',
    'releases.hashicorp.com',
    'api.cloudflare.com', '*.cloudflare.com',
    'api.supabase.com', '*.supabase.co',
    'api.betteruptime.com', '*.betteruptime.com',
    'api.expo.dev', '*.expo.dev',
    'oauth2.googleapis.com', 'www.googleapis.com', '*.googleapis.com',
    'storage.googleapis.com',
  ];

  /**
   * Executes only the fixed Terraform entrypoint baked into the image.
   */
  async runEntrypoint(): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    if (!this.ctx.container.running) await this.start();
    const process = await this.ctx.container.exec(['/entrypoint.sh']);
    const output = await process.output();
    return {
      exitCode: output.exitCode,
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
    };
  }
}
