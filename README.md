
# ClearPolicy Chrome Extension

ClearPolicy is a lightweight Chrome extension designed to simplify the way users interact with complex privacy policies and terms & conditions. It empowers users to make informed decisions about signing up for online services by identifying and summarizing problematic or concerning clauses.

---

## 🚀 Features

- **One-Click Activation**: Users can click on the extension when visiting a webpage with a Terms of Use or Privacy Policy to view the significant concerns.
- **Simplified Summaries**: Provides clear and concise explanations of the most critical issues using OpenAI's advanced capabilities.
- **Customizable Backend**: Deploy your own backend with OpenAI to personalize the extension.
- **Secure and Private**: No data is stored or shared; processing occurs through your own hosted backend.

---

## 📥 Installation

### 1. Clone the Repository

   ```bash
   git clone https://github.com/MitChaudhari/ClearPolicy.git
   cd ClearPolicy
   ```

### 2. Load the Extension in Chrome

   1. Open Chrome and navigate to `chrome://extensions/`.
   2. Enable "Developer mode" in the top right corner.
   3. Click on "Load unpacked" and select the `ClearPolicy` directory.

### 3. Set Up Your Backend

   To use ClearPolicy, you must set up your backend:

   1. **Create a Next.js Project**:
      ```bash
      npx create-next-app@latest
      cd your-nextjs-project
      ```
   2. **Add the Backend Code**:
      - Copy the `api/process-terms.js` file from cloned repository and place it as `api/process-terms.js` in your Next.js project.

   3. **Add Your OpenAI API Key**:
      - Create a `.env` file in the project root and add your OpenAI API key:
        ```
        OPENAI_API_KEY=your_openai_api_key_here
        ```

   4. **Deploy to Vercel**:
      - Push your project to GitHub.
      - Connect your GitHub repository to [Vercel](https://vercel.com/) and deploy.
      - Add your OpenAI API key to the environment variables on Vercel.

   5. **Update `background.js`**:
      - Replace the URL in `background.js` (line 33) with your Vercel live URL, appending `/api/process-terms`:
        ```javascript
        const response = await fetch('https://your-vercel-backend-url/api/process-terms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunkContent }),
        });
        ```

### 4. You're All Set!

   The ClearPolicy extension should now be ready for use in your Chrome browser.

---

## 🔧 Usage

1. **Navigate to a Website**: Visit any webpage with a Terms of Use or Privacy Policy.
2. **Click the Extension**: Activate the extension by clicking on the ClearPolicy icon in your toolbar.
3. **View the Summary**: A popup will display the most significant concern identified in the Terms of Use.

---

## 🖼️ Application Screenshots

| Company                | Screenshot                              |
|------------------------|-----------------------------------------|
| **Disney**             | ![Disney](https://github.com/MitChaudhari/ClearPolicy/raw/main/src/assets/app_ss/disney.png) |
| **McDonalds**          | ![McDonalds](https://github.com/MitChaudhari/ClearPolicy/raw/main/src/assets/app_ss/mcdonalds.png) |
| **PayPal**             | ![PayPal](https://github.com/MitChaudhari/ClearPolicy/raw/main/src/assets/app_ss/paypal.png) |

---

## 💡 Tips for Customization

- **Modify the Prompt**: You can adjust the prompt in `process-terms.js` to cater to your specific needs. For example:
  - Focus on clauses that involve **financial liability or monetary obligations**.
  - Highlight terms that may **limit user rights or legal recourse**.
  - Emphasize **data collection and sharing practices** that could compromise privacy.
  - Specify **user-friendly language** to ensure non-technical users can understand the summary.

  ### Example Modifications:
  1. To focus on financial concerns:
     ```javascript
     {
       role: "user",
       content: `As a legal expert reviewing a Terms of Use document, identify clauses related to financial liabilities, hidden fees, or payment obligations that could deter users from signing up. Highlight only the clauses with significant financial impact.`
     }
     ```

  2. To emphasize user rights:
     ```javascript
     {
       role: "user",
       content: `As a legal expert reviewing a Terms of Use document, identify sections that excessively limit user rights, including restrictions on account termination, refund policies, or arbitration clauses. Focus on the clauses that may cause the most concern for users.`
     }
     ```

  3. To address privacy concerns:
     ```javascript
     {
       role: "user",
       content: `As a legal expert reviewing a Privacy Policy, identify clauses that involve excessive data collection, invasive tracking methods, or sharing personal data with third parties. Focus on practices that could violate user privacy expectations.`
     }
     ```

- **Experiment and Iterate**: Test different prompts to see what works best for your use case and refine them based on feedback or the type of summaries you need.

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 🛡️ Disclaimer

ClearPolicy does not store or share any data. All processing occurs locally or through your own hosted backend.
