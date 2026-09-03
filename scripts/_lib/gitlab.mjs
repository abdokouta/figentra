/**
 * @file gitlab.mjs
 * @module scripts/_lib/gitlab
 * @description GitLab API v4 wrapper built on `http.mjs`. Covers the
 *   operations `scripts/` needs across the workspace's four subgroups:
 *
 *     - Group + project listing (paginated).
 *     - Project / group rename + description + visibility updates.
 *     - Registry consumer URL construction for pnpm + Composer.
 *     - Composer package publish (`POST .../packages/composer`).
 *     - Repository CI file operations (create / update).
 *
 *   Every method takes a `{ baseURL, token }` config so scripts can
 *   pick between `figentra`-owned + `stackra-inc`-owned tokens without
 *   env-var juggling.
 *
 * ## Usage
 *
 * ```javascript
 * import { GitlabClient } from "./_lib/gitlab.mjs";
 *
 * // Consumer runs under
 * //   doppler run --scope . -- ./scripts/remap-secrets.sh node scripts/foo.mjs
 * // so process.env.STACKRA_GITLAB_TOKEN is already injected by
 * // Doppler + kept as the canonical Layer 1 name per ADR-0085 §Rule 1.
 * if (!process.env.STACKRA_GITLAB_TOKEN) {
 *   throw new Error("STACKRA_GITLAB_TOKEN missing — invoke under `doppler run -- ./scripts/remap-secrets.sh`");
 * }
 *
 * const gl = new GitlabClient({
 *   baseURL: "https://gitlab.com/api/v4",
 *   token:   process.env.STACKRA_GITLAB_TOKEN,
 * });
 *
 * const projects = await gl.listGroupProjects("138849321", { includeSubgroups: false });
 * ```
 *
 * ## Auth
 *
 *   Every request carries `PRIVATE-TOKEN: <token>`. Tokens are NEVER
 *   logged (log.mjs redacts anything that looks like `glpat-...`).
 */

import { httpJson, HttpError } from "./http.mjs";
import { log } from "./log.mjs";

/**
 * @typedef {object} GitlabConfig
 * @property {string} baseURL   e.g. `https://gitlab.com/api/v4`.
 * @property {string} token     Personal / project access token.
 */

/**
 * @typedef {object} GitlabProject
 * @property {number}  id
 * @property {string}  name
 * @property {string}  path
 * @property {string}  path_with_namespace
 * @property {string}  description
 * @property {string}  web_url
 * @property {string}  http_url_to_repo
 * @property {string}  ssh_url_to_repo
 * @property {string}  visibility
 * @property {string[]} topics
 * @property {string}  default_branch
 * @property {boolean} archived
 */

/**
 * @typedef {object} GitlabGroup
 * @property {number} id
 * @property {string} name
 * @property {string} full_path
 * @property {string} description
 * @property {string} visibility
 * @property {string} web_url
 */

export class GitlabClient {
  /** @param {GitlabConfig} config */
  constructor(config) {
    /** @private */ this.baseURL = config.baseURL.replace(/\/$/, "");
    /** @private */ this.headers = { "PRIVATE-TOKEN": config.token };
  }

  /**
   * Paginated GET — walks every page of a paginated GitLab endpoint.
   *
   * @template T
   * @param {string} path        e.g. `/groups/138849321/projects`
   * @param {Record<string, string | number | boolean>} [query]
   * @returns {Promise<T[]>}
   */
  async paginate(path, query = {}) {
    /** @type {T[]} */
    const all = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      /** @type {T[]} */
      const batch = await httpJson({
        url: `${this.baseURL}${path}`,
        headers: this.headers,
        query: { ...query, page, per_page: perPage },
      });

      if (!Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }

    log.debug(`paginate ${path} → ${all.length} items`);
    return all;
  }

  /**
   * List every project under a group (optionally recursing into subgroups).
   *
   * @param {string | number} groupId  Group id OR URL-encoded path.
   * @param {{ includeSubgroups?: boolean, archived?: boolean }} [options]
   * @returns {Promise<GitlabProject[]>}
   */
  async listGroupProjects(groupId, options = {}) {
    return this.paginate(`/groups/${encodeURIComponent(String(groupId))}/projects`, {
      include_subgroups: options.includeSubgroups ?? false,
      ...(options.archived !== undefined ? { archived: options.archived } : {}),
      order_by: "path",
      sort: "asc",
    });
  }

  /**
   * Fetch a single project by id or `namespace/path`.
   *
   * @param {string | number} idOrPath
   * @returns {Promise<GitlabProject>}
   */
  async getProject(idOrPath) {
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(idOrPath))}`,
      headers: this.headers,
    });
  }

  /**
   * Read the raw content of a repository file at a given ref.
   * Returns the API response with `.content` (base64-encoded string).
   *
   * @param {string | number} projectId
   * @param {string} filePath  URL-decoded path (e.g. `.gitlab-ci.yml`).
   * @param {string} ref       Branch, tag, OR commit SHA.
   * @returns {Promise<{ content: string, encoding: "base64", file_path: string, blob_id: string }>}
   */
  async getFile(projectId, filePath, ref) {
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/repository/files/${encodeURIComponent(filePath)}`,
      query: { ref },
      headers: this.headers,
    });
  }

  /**
   * Create a branch on a project from a given ref.
   *
   * @param {string | number} projectId
   * @param {string} branch  New branch name.
   * @param {string} ref     Source ref (branch / tag / SHA).
   * @returns {Promise<{ name: string, commit: { id: string } }>}
   */
  async createBranch(projectId, branch, ref) {
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/repository/branches`,
      method: "POST",
      headers: this.headers,
      body: { branch, ref },
    });
  }

  /**
   * Fetch a branch. Returns `null` on 404 (idiomatic — many callers
   * treat "branch doesn't exist" as a legitimate state, not an error).
   *
   * @param {string | number} projectId
   * @param {string} branch
   * @returns {Promise<{ name: string, commit: { id: string, short_id: string }, protected: boolean, default: boolean } | null>}
   */
  async getBranch(projectId, branch) {
    try {
      return await httpJson({
        url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/repository/branches/${encodeURIComponent(branch)}`,
        headers: this.headers,
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return null;
      throw err;
    }
  }

  /**
   * Delete a branch. Idempotent — 404 on second delete is fine.
   *
   * WARNING: does NOT bypass branch protection. If the branch is
   * protected, GitLab returns 403 + this method throws.
   *
   * @param {string | number} projectId
   * @param {string} branch
   * @returns {Promise<void>}
   */
  async deleteBranch(projectId, branch) {
    try {
      await httpJson({
        url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/repository/branches/${encodeURIComponent(branch)}`,
        method: "DELETE",
        headers: this.headers,
      });
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return;
      throw err;
    }
  }

  /**
   * Compare two refs. Returns commits in `to` that aren't in `from`
   * + the diff between them. The `commits` array is EMPTY when `to`
   * is a strict ancestor of `from` (i.e. `from` is ahead OR equal).
   *
   * Use for fast-forward safety check before syncing a branch:
   *
   *     compare(pid, from=main, to=develop).commits.length === 0
   *     → develop is an ancestor of main → FF-safe to sync develop → main
   *
   * @param {string | number} projectId
   * @param {string} from  base ref
   * @param {string} to    head ref
   * @returns {Promise<{ commits: Array<{id: string, short_id: string, title: string}>, diffs: unknown[] }>}
   */
  async compareRefs(projectId, from, to) {
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/repository/compare`,
      query: { from, to },
      headers: this.headers,
    });
  }

  /**
   * List every protected branch on a project. Consumers use this to
   * skip protected-branch destructive operations (delete/recreate).
   *
   * @param {string | number} projectId
   * @returns {Promise<Array<{ name: string, push_access_levels: Array<{ access_level: number }> }>>}
   */
  async listProtectedBranches(projectId) {
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/protected_branches`,
      headers: this.headers,
    });
  }

  /**
   * Open a merge request on a project.
   *
   * @param {string | number} projectId
   * @param {object} spec
   * @param {string} spec.source_branch
   * @param {string} spec.target_branch
   * @param {string} spec.title
   * @param {string} [spec.description]
   * @param {boolean} [spec.remove_source_branch]
   * @returns {Promise<{ iid: number, web_url: string, id: number }>}
   */
  async createMergeRequest(projectId, spec) {
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/merge_requests`,
      method: "POST",
      headers: this.headers,
      body: spec,
    });
  }

  /**
   * List merge requests on a project.
   *
   * @param {string | number} projectId
   * @param {{ state?: "opened" | "closed" | "merged" | "all", scope?: "created_by_me" | "assigned_to_me" | "all" }} [options]
   * @returns {Promise<Array<{ iid: number, id: number, title: string, source_branch: string, target_branch: string, state: string, web_url: string, author: { username: string }, merge_status: string, has_conflicts: boolean, draft: boolean, work_in_progress: boolean, updated_at: string, created_at: string }>>}
   */
  async listMergeRequests(projectId, options = {}) {
    return this.paginate(`/projects/${encodeURIComponent(String(projectId))}/merge_requests`, {
      state: options.state ?? "opened",
      scope: options.scope ?? "all",
      order_by: "updated_at",
      sort: "desc",
    });
  }

  /**
   * Accept (merge) an open merge request.
   *
   * Idempotent per GitLab — a 405 on a MR that's already merged is
   * caught + returns the existing merged state rather than throwing.
   *
   * @param {string | number} projectId
   * @param {number} iid  Internal ID of the MR (not the global `id`).
   * @param {{ mergeCommitMessage?: string, squash?: boolean, shouldRemoveSourceBranch?: boolean, mergeWhenPipelineSucceeds?: boolean }} [options]
   * @returns {Promise<{ id: number, iid: number, state: string, merge_commit_sha: string | null }>}
   */
  async acceptMergeRequest(projectId, iid, options = {}) {
    /** @type {Record<string, string | number | boolean>} */
    const body = {};
    if (options.mergeCommitMessage !== undefined) {
      body.merge_commit_message = options.mergeCommitMessage;
    }
    if (options.squash !== undefined) body.squash = options.squash;
    if (options.shouldRemoveSourceBranch !== undefined) {
      body.should_remove_source_branch = options.shouldRemoveSourceBranch;
    }
    if (options.mergeWhenPipelineSucceeds !== undefined) {
      body.merge_when_pipeline_succeeds = options.mergeWhenPipelineSucceeds;
    }
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/merge_requests/${iid}/merge`,
      method: "PUT",
      headers: this.headers,
      body,
    });
  }

  /**
   * Close (without merging) a merge request.
   *
   * @param {string | number} projectId
   * @param {number} iid
   * @returns {Promise<{ id: number, iid: number, state: string }>}
   */
  async closeMergeRequest(projectId, iid) {
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(projectId))}/merge_requests/${iid}`,
      method: "PUT",
      headers: this.headers,
      body: { state_event: "close" },
    });
  }

  /**
   * List every non-default, non-protected branch on a project. Consumers
   * use this to enumerate feature-branch candidates for stale-branch
   * pruning.
   *
   * @param {string | number} projectId
   * @returns {Promise<Array<{ name: string, default: boolean, protected: boolean, merged: boolean, commit: { id: string, short_id: string, committed_date: string } }>>}
   */
  async listBranches(projectId) {
    return this.paginate(
      `/projects/${encodeURIComponent(String(projectId))}/repository/branches`,
      {},
    );
  }

  /**
   * Fetch a single group by id or `full/path`.
   *
   * @param {string | number} idOrPath
   * @returns {Promise<GitlabGroup>}
   */
  async getGroup(idOrPath) {
    return httpJson({
      url: `${this.baseURL}/groups/${encodeURIComponent(String(idOrPath))}`,
      headers: this.headers,
    });
  }

  /**
   * Update a project's editable fields (name, description, topics, visibility).
   *
   * @param {string | number} idOrPath
   * @param {Partial<Pick<GitlabProject, "name" | "description" | "topics" | "visibility">>} patch
   * @returns {Promise<GitlabProject>}
   */
  async updateProject(idOrPath, patch) {
    return httpJson({
      url: `${this.baseURL}/projects/${encodeURIComponent(String(idOrPath))}`,
      method: "PUT",
      headers: this.headers,
      body: patch,
    });
  }

  /**
   * Update a group's editable fields.
   *
   * @param {string | number} idOrPath
   * @param {Partial<Pick<GitlabGroup, "name" | "description" | "visibility">>} patch
   * @returns {Promise<GitlabGroup>}
   */
  async updateGroup(idOrPath, patch) {
    return httpJson({
      url: `${this.baseURL}/groups/${encodeURIComponent(String(idOrPath))}`,
      method: "PUT",
      headers: this.headers,
      body: patch,
    });
  }

  /**
   * Create a new group or subgroup.
   *
   * @param {{ path: string, name: string, parent_id?: number, visibility?: "private" | "internal" | "public", description?: string }} spec
   * @returns {Promise<GitlabGroup>}
   */
  async createGroup(spec) {
    return httpJson({
      url: `${this.baseURL}/groups`,
      method: "POST",
      headers: this.headers,
      body: spec,
    });
  }

  /**
   * Transfer a project to a new namespace (either a group or user).
   * `namespace` is the target namespace's id (number) OR path (string).
   *
   * @param {number} projectId
   * @param {string | number} namespace  Target group id or full-path.
   * @returns {Promise<GitlabProject>}
   */
  async transferProject(projectId, namespace) {
    return httpJson({
      url: `${this.baseURL}/projects/${projectId}/transfer`,
      method: "PUT",
      headers: this.headers,
      body: { namespace },
    });
  }

  /**
   * Delete a project. Depending on GitLab config this may be either
   * immediate OR delayed (marked-for-deletion). Idempotent — 404 from
   * a subsequent call is fine.
   *
   *   `permanentlyRemove: true` — skip the retention window. GitLab
   *   requires `fullPath` alongside as a safety confirmation (must
   *   match the project's `path_with_namespace`). Rejected with 400
   *   otherwise.
   *
   * @param {number} projectId
   * @param {{ permanentlyRemove?: boolean, fullPath?: string }} [options]
   * @returns {Promise<{ message: string }>}
   */
  async deleteProject(projectId, options = {}) {
    /** @type {Record<string, string | number | boolean>} */
    const query = {};
    if (options.permanentlyRemove) {
      query.permanently_remove = true;
      if (options.fullPath) query.full_path = options.fullPath;
    }
    return httpJson({
      url: `${this.baseURL}/projects/${projectId}`,
      method: "DELETE",
      headers: this.headers,
      ...(Object.keys(query).length > 0 ? { query } : {}),
    });
  }

  /**
   * Register a Composer package version against the project's Composer
   * registry. GitLab reads `composer.json` from the given tag and indexes.
   *
   * @param {number} projectId
   * @param {string} tag  e.g. `v1.0.0`
   * @returns {Promise<unknown>}
   */
  async publishComposer(projectId, tag) {
    return httpJson({
      url: `${this.baseURL}/projects/${projectId}/packages/composer`,
      method: "POST",
      headers: this.headers,
      query: { tag },
    });
  }

  /**
   * Create OR update a repository file (branch-scoped).
   *
   * @param {number}  projectId
   * @param {string}  filePath   URL-encoded automatically. Use `.gitlab-ci.yml`, etc.
   * @param {string}  branch
   * @param {string}  content
   * @param {string}  commitMessage
   * @param {"create" | "update"} [action]  Default "update" — GitLab returns 400 if wrong.
   * @returns {Promise<unknown>}
   */
  async writeFile(projectId, filePath, branch, content, commitMessage, action = "update") {
    const method = action === "create" ? "POST" : "PUT";
    return httpJson({
      url: `${this.baseURL}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`,
      method,
      headers: this.headers,
      body: { branch, content, commit_message: commitMessage },
    });
  }
}
