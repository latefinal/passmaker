const { PKPass } = require("passkit-generator");
const fs = require("fs");

async function generatePass() {
    const pass = await PKPass.from(
        {
            model: "../pass",
            certificates: {
                wwdr: fs.readFileSync("../cert/wwdr.pem"),
                signerCert: fs.readFileSync("../cert/signerCert.pem"),
                signerKey: fs.readFileSync("../cert/signerKey.pem"),
            },
        },
        {
            passTypeIdentifier: "pass.com.acmw.passmaker",
            teamIdentifier: "LUB2L5GCLL",
            serialNumber: "000",
            organizationName: "Toy Town",
            description: "Toy Town Membership",
            logoText: "Gay Company",
        }
    );

    const buffer = pass.getAsBuffer();
    fs.writeFileSync("../pass.pass/pass.pkpass", buffer);
    console.log("Pass generated successfully!");
}

generatePass().catch(console.error);
