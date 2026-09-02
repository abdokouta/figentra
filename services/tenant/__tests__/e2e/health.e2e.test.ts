/**
 * @file __tests__/e2e/health.e2e.test.ts
 * @description End-to-end smoke test for the service HTTP boundary.
 * @security The test verifies only the public liveness contract and does not
 *   exercise authenticated business operations.
 */
import { Test, type TestingModule } from "@nestjs/testing";
import { type INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module.js";

describe("HTTP health boundary (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("exposes the liveness endpoint", async () => {
    await request(app.getHttpServer()).get("/health/live").expect(200);
  });
});
