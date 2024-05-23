import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://captivize.com
// - Name: Captivize
// - Contact information: amirbrahamm@gmail.com
// - Description: Generate captions from videos
// - Ownership: when buying a package, users can add captions to their videos
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://captivize.com/privacy-policy
// - Governing Law: United States
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Terms and Conditions for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Terms & Services
Effective Date: May 23, 2024

Welcome to Captivize! These Terms & Services govern your use of our website (https://captivize.com) and services. By using our services, you agree to these terms.

1. Services Provided
Captivize allows users to generate captions from videos. Upon purchasing a package, users gain the ability to add captions to their videos.

2. User Accounts
To use our services, you must create an account and provide accurate information, including your name, email, and payment information.

3. Data Collection
We collect personal data such as your name, email, and payment information, as well as non-personal data through web cookies. For more details, please review our Privacy Policy.

4. Ownership and Rights
By purchasing a package, you obtain the rights to add captions to your videos using our service. All other rights are reserved by Captivize.

5. Contact Information
For any inquiries, please contact us at tonyconte1995@gmail.com.

6. Governing Law
These terms are governed by the laws of the United States.

7. Updates to Terms
We may update these terms from time to time. Users will be notified of any changes via email.

Thank you for using Captivize!

By using Captivize, you agree to these Terms & Services.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
