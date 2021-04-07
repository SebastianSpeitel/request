import { createRequest } from "./index";

type Api = {
  raw(): Response;
  void(): void;
  string(): string;
  json(): { isJson: true };
};

const req = createRequest<Api>("");
const reqJson = createRequest<Api, { parse: "json" }>("", { parse: "json" });

// should accept no second parameter
req("void");

// should accept an empty second paramters
req("void");

// should accept parse:json
req("json", { parse: "json" });

//@ts-expect-error should require a second argument
req("json");

//@ts-expect-error should require parse
req("json", {});

//@ts-expect-error should only allow parse:'json'
req("json", { parse: "formData" });

//@ts-expect-error should require setting parse:false
reqJson("raw");

// should allow setting parse:false
reqJson("raw", { parse: false });

// should allow omitting parse
req("raw");
