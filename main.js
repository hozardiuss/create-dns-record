/**
 * This Action uses Curl to create of update DNS record with CloudFlare API
 * read documentation for CF API: https://api.cloudflare.com/#dns-records-for-a-zone-list-dns-records
 */

const path = require("path");

const cp = require("child_process");

const getCurrentRecordId = () => {
  const { status, stdout } = cp.spawnSync("curl", [
    ...["--header", `Authorization: Bearer ${process.env.INPUT_TOKEN}`],
    ...["--header", "Content-Type: application/json"],
    `https://api.cloudflare.com/client/v4/zones/${process.env.INPUT_ZONE}/dns_records?name=${encodeURIComponent(process.env.INPUT_NAME)}`,
  ]);

  if (status !== 0) {
    process.exit(status);
  }

  const { success, result, errors } = JSON.parse(stdout.toString());

  if (!success) {
    console.log(`::error ::${errors[0].message}`);
    process.exit(1);
  }

  return result[0] ? result[0].id : null;
};

const createRecord = () => {
  const { status, stdout } = cp.spawnSync("curl", [
    ...["--request", "POST"],
    ...["--header", `Authorization: Bearer ${process.env.INPUT_TOKEN}`],
    ...["--header", "Content-Type: application/json"],
    ...["--silent", "--data"],
    JSON.stringify({
      type: process.env.INPUT_TYPE,
      name: process.env.INPUT_NAME,
      content: process.env.INPUT_CONTENT,
      ttl: Number(process.env.INPUT_TTL),
      proxied: process.env.INPUT_PROXIED == "true",
    }),
    `https://api.cloudflare.com/client/v4/zones/${process.env.INPUT_ZONE}/dns_records`,
  ]);

  if (status !== 0) {
    process.exit(status);
  }

  const { success, result, errors } = JSON.parse(stdout.toString());

  if (!success) {
    console.dir(errors[0]);
    console.log(`::error ::${errors[0].message}`);
    process.exit(1);
  }

  console.log(`::set-output name=id::${result.id}`);
  console.log(`::set-output name=name::${result.name}`);
};

const updateRecord = (id) => {
  console.log(`Record exists with ${id}, updating...`);
  const { status, stdout } = cp.spawnSync("curl", [
    ...["--request", "PUT"],
    ...["--header", `Authorization: Bearer ${process.env.INPUT_TOKEN}`],
    ...["--header", "Content-Type: application/json"],
    ...["--silent", "--data"],
    JSON.stringify({
      type: process.env.INPUT_TYPE,
      name: process.env.INPUT_NAME,
      content: process.env.INPUT_CONTENT,
      ttl: Number(process.env.INPUT_TTL),
      proxied: process.env.INPUT_PROXIED == "true",
    }),
    `https://api.cloudflare.com/client/v4/zones/${process.env.INPUT_ZONE}/dns_records/${id}`,
  ]);

  if (status !== 0) {
    process.exit(status);
  }

  const { success, result, errors } = JSON.parse(stdout.toString());

  if (!success) {
    console.dir(errors[0]);
    console.log(`::error ::${errors[0].message}`);
    process.exit(1);
  }

  console.log(`::set-output name=record_id::${result.id}`);
  console.log(`::set-output name=name::${result.name}`);
}

const id = getCurrentRecordId();
if (id) {
  updateRecord(id);
  process.exit(0);
}

createRecord();
