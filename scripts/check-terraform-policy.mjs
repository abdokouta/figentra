#!/usr/bin/env node
/**
 * @file scripts/check-terraform-policy.mjs
 * @description Static Terraform safety gate for production mutations.
 */
import { existsSync, readFileSync } from 'node:fs';
const required=['infrastructure/terraform/versions.tf','infrastructure/terraform/providers.tf','infrastructure/terraform/terraform.mk'];
const failures=required.filter((f)=>!existsSync(f));
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
const mk=readFileSync('infrastructure/terraform/terraform.mk','utf8');
for(const token of ['production','yes-apply-production','yes-destroy-production']) if(!mk.includes(token)) failures.push(`terraform.mk missing ${token}`);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Terraform policy gate passed.');
