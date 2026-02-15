import dns from "node:dns";
import dnsP from "node:dns/promises";

dns.setServers(["1.1.1.1", "1.0.0.1"]);
console.log("Node DNS servers:", dns.getServers());

dnsP.resolveSrv("_mongodb._tcp.cluster0.x8fia2g.mongodb.net")
  .then(console.log)
  .catch(console.error);
