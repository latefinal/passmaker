# Passmaker: Apple Wallet Pass Generator

## Introduction
Passmaker is a project designed to simplify the creation of digital passes for Apple Wallet. With Passmaker, you can generate passes such as boarding passes, coupons, event tickets, loyalty cards, and more, allowing users to store and access them conveniently on their iPhone, iPod Touch, or Apple Watch. This project leverages Apple’s PassKit framework to create, sign, and distribute passes that can be added to Apple Wallet for seamless, location- and time-based user experiences.

This README provides a step-by-step guide to generating Apple Wallet passes and outlines the credentials required to set up and use Passmaker effectively.

## Features
- Generate customizable passes for Apple Wallet (e.g., coupons, tickets, loyalty cards).
- Support for dynamic updates via push notifications.
- Location- and time-based pass display for enhanced user engagement.
- Barcode support (QR, Aztec, PDF417) and NFC-enabled passes.
- Easy integration with existing systems for pass distribution via apps, email, or web.

## Prerequisites
Before using Passmaker, ensure you have:
- An Apple Developer Account (Account Holder or Admin role required for certificate creation).
- A macOS system with Keychain Access for certificate management.
- OpenSSL installed for certificate processing (optional, depending on implementation).
- A backend server or service to generate and sign passes (mobile apps cannot generate passes directly).
- Basic knowledge of JSON for pass configuration and Node.js (or another backend language) for pass generation.

## Step-by-Step Guide to Generating Apple Wallet Passes
Follow these steps to create and distribute passes using Passmaker:

### Step 1: Set Up Your Apple Developer Account
1. **Register for an Apple Developer Account**: Sign up at [developer.apple.com](https://developer.apple.com). You’ll need an Account Holder or Admin role to create certificates and identifiers.
2. **Access Certificates, Identifiers & Profiles**: Log in to your Apple Developer Account and navigate to the “Certificates, Identifiers & Profiles” section.

### Step 2: Create a Pass Type Identifier
1. **Register a Pass Type ID**:
   - In the Apple Developer Portal, go to **Identifiers** > **Pass Type IDs** and click the “+” button.
   - Enter a description (e.g., “Passmaker Coupon Pass”) and a unique Pass Type Identifier (e.g., `pass.com.yourdomain.passmaker`).
   - Click **Continue**, review, and **Register**.
2. **Note the Pass Type ID**: This will be used in your `pass.json` file as the `passTypeIdentifier`.

### Step 3: Generate a Pass Signing Certificate
1. **Create a Certificate Signing Request (CSR)**:
   - On your Mac, open **Keychain Access** (Applications > Utilities).
   - Go to **Keychain Access** > **Certificate Assistant** > **Request a Certificate From a Certificate Authority**.
   - Enter your email address and a common name (e.g., your Pass Type ID description).
   - Leave the CA Email Address blank, select **Saved to disk**, and save the `.certSigningRequest` file.
2. **Create the Certificate**:
   - In the Apple Developer Portal, select your Pass Type ID and click **Create Certificate**.
   - Upload the `.certSigningRequest` file, provide a certificate name, and click **Continue**.
   - Download the generated `.cer` file.
3. **Export the Certificate**:
   - Open the `.cer` file in Keychain Access.
   - Locate the certificate (e.g., “Pass Type ID: pass.com.yourdomain.passmaker”), right-click, and select **Export**.
   - Save it as a `.p12` file, setting an export password (this will be your `SIGNER_PASSPHRASE`).
4. **Convert to PEM Format (Optional)**:
   - If your implementation requires PEM files, use OpenSSL to convert the `.p12` file:
     ```bash
     openssl pkcs12 -in Certificates.p12 -clcerts -nokeys -out passcertificate.pem -passin pass:<import_password>
     openssl pkcs12 -in Certificates.p12 -nocerts -out passkey.pem -passin pass:<import_password> -passout pass:<key_password>
     ```
   - Store these files securely for signing passes.

### Step 4: Obtain the WWDR Certificate
1. **Download the WWDR Certificate**:
   - In Keychain Access, locate the “Apple Worldwide Developer Relations Certification Authority” (WWDR) certificate.
   - Right-click and export it as a `.pem` file (e.g., `WWDR.pem`).
   - Alternatively, download it from [Apple’s Certificate Authority page](https://www.apple.com/certificateauthority/).
2. **Store the WWDR Certificate**: This is required to sign passes and verify their authenticity.

### Step 5: Design the Pass
1. **Create the Pass Structure**:
   - Create a folder named `yourPassName.pass` containing:
     - `pass.json`: Defines the pass structure (e.g., pass type, fields, barcodes).
     - `icon.png`: Required icon for the pass (512x512 pixels recommended).
     - `logo.png`: Optional logo for branding.
     - Optional: `strip.png` or `thumbnail.png` for additional visuals.
   - Example `pass.json`:
     ```json
     {
       "formatVersion": 1,
       "passTypeIdentifier": "pass.com.yourdomain.passmaker",
       "teamIdentifier": "<your_team_identifier>",
       "organizationName": "Your Organization",
       "description": "Passmaker Coupon Pass",
       "serialNumber": "123456",
       "coupon": {
         "primaryFields": [
           {
             "key": "offer",
             "label": "Discount",
             "value": "20% Off"
           }
         ]
       },
       "barcode": {
         "format": "PKBarcodeFormatQR",
         "message": "https://yourdomain.com/offer",
         "messageEncoding": "iso-8859-1"
       }
     }
     ```
2. **Customize Visuals**:
   - Use your brand’s colors, fonts, and logos for consistency.
   - Ensure text is legible and barcodes (QR, Aztec, or PDF417) are scannable.
3. **Test in Simulator**:
   - Drag the pass folder into the iOS Simulator to preview the pass.
   - Check for errors in the Console app if the pass doesn’t display correctly.

### Step 6: Sign the Pass
1. **Generate a Manifest**:
   - Create a `manifest.json` file listing all files in the pass package with their SHA-1 hashes.
   - Example:
     ```json
     {
       "pass.json": "<SHA1_hash_of_pass.json>",
       "icon.png": "<SHA1_hash_of_icon.png>",
       "logo.png": "<SHA1_hash_of_logo.png>"
     }
     ```
2. **Sign the Manifest**:
   - Use your Pass Type ID certificate and WWDR certificate to create a PKCS #7 detached signature.
   - Tools like the `passkit-generator` Node.js library can automate this process.
   - Example using OpenSSL:
     ```bash
     openssl smime -binary -sign -certfile WWDR.pem -signer passcertificate.pem -inkey passkey.pem -in manifest.json -out signature -outform DER -passin pass:<key_password>
     ```
3. **Package the Pass**:
   - Place `pass.json`, `manifest.json`, `signature`, and image files in the `yourPassName.pass` folder.
   - Compress the folder into a `.zip` file and rename it to `yourPassName.pkpass`.

### Step 7: Distribute the Pass
1. **Choose a Distribution Method**:
   - **In-App**: Use the PassKit API to present the pass and add it to Wallet with the `PKAddPassButton`.
   - **Email**: Attach the `.pkpass` file to an email with an “Add to Apple Wallet” badge.
   - **Web**: Host the `.pkpass` file and provide a download link with the “Add to Apple Wallet” badge.
   - **QR Code**: Generate a QR code linking to the `.pkpass` file for scanning.
2. **Add the Badge**:
   - Use Apple’s “Add to Apple Wallet” badge (available in SVG/EPS formats) for web, email, or print.
   - Follow Apple’s badge guidelines for size and placement.
3. **Test Distribution**:
   - Send the `.pkpass` file to a test device via email or a web link.
   - Tap “Add” to add the pass to Apple Wallet and verify it displays correctly.

### Step 8: Enable Dynamic Updates (Optional)
1. **Set Up Push Notifications**:
   - Register a web service URL in `pass.json` to send push notifications for updates (e.g., flight gate changes).
   - Use the PassKit API to send updates via Apple’s push notification service.
2. **Automate Updates**:
   - Integrate with platforms like Zapier or use the PassKit API to update passes based on events or data changes.

## Required Credentials
To generate and sign Apple Wallet passes, you need the following credentials:
1. **Apple Developer Account**:
   - Role: Account Holder or Admin.
   - Used to create Pass Type IDs and certificates.
2. **Pass Type Identifier**:
   - A unique identifier (e.g., `pass.com.yourdomain.passmaker`) registered in the Apple Developer Portal.
3. **Team Identifier**:
   - Found in your Apple Developer Account under Membership or Certificates, Identifiers & Profiles.
   - Included in `pass.json` as `teamIdentifier`.
4. **Pass Signing Certificate**:
   - A `.p12` or `.pem` certificate generated from a CSR and associated with your Pass Type ID.
   - Expires annually and must be renewed to continue signing new passes or updating existing ones.
5. **WWDR Certificate**:
   - Apple’s Worldwide Developer Relations Certification Authority certificate (`WWDR.pem`).
   - Required for signing passes to verify authenticity.
6. **Certificate Password (Optional)**:
   - The password set when exporting the `.p12` certificate (used as `SIGNER_PASSPHRASE` in some implementations).
7. **Contact Information**:
   - Required on the back of the pass (e.g., email, phone, or address of the certificate owner or brand).

## Notes
- **Certificate Expiry**: Passes already installed on devices continue to work if the certificate expires, but you cannot sign new passes or update existing ones until the certificate is renewed.
- **Barcode Optimization**: Use QR codes for Apple Watch compatibility and test barcodes under real-world conditions to ensure scannability.
- **Security**: Store certificates and private keys securely, as they are sensitive credentials.
- **Testing**: Use the iOS Simulator to test passes during development. Check the Console app for error logs if issues arise.
- **Third-Party Tools**: Consider tools like Passkit Visual Designer, PassSource, or Passcreator for easier pass design and management.

## Resources
- [Apple Wallet Developer Guide](https://developer.apple.com/wallet/)
- [PassKit Framework Documentation](https://developer.apple.com/documentation/passkit)
- [Passkit Generator (Node.js)](https://github.com/alexandercerutti/passkit-generator)
- [Add to Apple Wallet Badge Guidelines](https://developer.apple.com/wallet/add-to-apple-wallet-guidelines/)
- [PassSource](https://www.passsource.com)
- [Passcreator](https://www.passcreator.com)

## Contributing
Contributions are welcome! Please submit a pull request or open an issue to suggest improvements or report bugs.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
