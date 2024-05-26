import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR PRIVACY POLICY — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple privacy policy for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: Captivize
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Purpose of Data Collection: Order processing
// - Data sharing: we do not share the data with any other parties
// - Children's Privacy: we do not collect any data from children
// - Updates to the Privacy Policy: users will be updated by email
// - Contact information: marc@shipfa.st

// Please write a simple privacy policy for my site. Add the current date.  Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
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
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`

Effective Date: May 23, 2024

At Captivize, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, and safeguard your information when you use our website, https://captivize.com.

1. Information We Collect

Personal Data: When you use Captivize, we collect the following personal information:

Name
Email address
Payment information
Non-Personal Data: We also collect non-personal data through web cookies to enhance your experience on our site.

2. Purpose of Data Collection

We collect your data to process orders and ensure a smooth transaction experience.

3. Data Sharing

We do not share your personal information with any other parties.

4. Children's Privacy

Captivize does not knowingly collect any data from children. If we become aware that we have collected personal data from a child, we will delete it immediately.

5. Updates to This Privacy Policy

We may update this Privacy Policy from time to time. Users will be notified of any changes via email.

6. Contact Us

If you have any questions or concerns about this Privacy Policy, please contact us at tonyconte1995@gmail.com.

Thank you for trusting Captivize with your information.

Captivize Team`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
