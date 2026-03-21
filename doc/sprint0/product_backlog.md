## User Stories
Also recorded at Jira: https://cscc01groupproject2048.atlassian.net/jira/software/projects/KAN/list?jql=project%20%3D%20KAN%20ORDER%20BY%20created%20DESC

1. As a user I would like to create an account so that I can start talking to the AI

- Acceptance Criteria: Given I enter valid registration details, when I submit the form, then I should be directed to the home page of the application.

2. As a user I would like to chat to the AI so I can get some financial advice

* Acceptance Criteria: Given I am on the application chat page, when I type a message and send it, then the AI should respond with unbiased financial guidance relevant to my question.

3. As a user I would like to chat using my voice so that I don’t have to type it out

* Acceptance Criteria: Given I tap the voice command button (microphone symbol), when I speak my prompt, then the functionality should convert my speech to text.

4. As a user I would like to be able to sign out so I can log into another account

* Acceptance Criteria: Given I open the account settings (where there is option for sign out), when I select the “sign out” button, the system should log me out of the current account and return me to the login screen.

5. As a user I would like to be able manage my chat history so I can choose which ones I want to keep

* Acceptance Criteria: Given I open my chat history (on the sidebar), when I click on a previous chat, then I should be able to continue my previous session, and be able to rename, delete, or add it to favourites. 

6. As a user I would like complete a series of questions about myself so that I can give the AI some context when generating responses

- Acceptance Criteria:  Given that I navigate to my profile settings, when I complete the initial questions, then the answers should be visible in my profile.

7. As a user I would like edit my initial screening questions so I can update it with the latest information

* Acceptance Criteria: Given I navigate to my profile settings, when I update my personal info, then the system should save the new values, and the AI should use the updated info.

8. As a user I would like to create a portfolio so that the AI can use that information to provide better responses

* Acceptance Criteria:  Given that I open the portfolio section, when I add assets (ETF’s, Mutual funds) and my investment distributions(X shares in Y funds), then the system should save them as part of my portfolio.

9. As a user with portfolio set up I would like AI to give finantial suggestions based on my portfolio so that the financial information I received is tailored and most suitable for me

* Acceptance Criteria: Given I ask for investment advice, when a portfolio info exists, then the AI should reference my portfolio when generating advice. 

10. As a user, I want the finantial advices given to me to be based on lastest ETF/Mutual funds info so that my responses are accurate

- Acceptance Criteria: Given that the time reaches a pre-defined time every day, when I prompt the AI about any fund/stock price-related information, then the response should accurately reflect the prices of the current date

11. As a user I would like to edit my portfolio so I can update it with the latest information

- Acceptance Criteria: Given I navigate to my profile settings, when I update my portfolio info, then the system should save the new values, and the AI should use the updated info.

12. As a user, I want to simulate changes in my income or risk tolerance, so that I can explore different investment scenarios.

Acceptance Criteria: Given I specify a hypothetical change (e.g., higher income), when I ask for advice, then the AI should base recommendations on the hypothetical scenario

13. As a user, I want the AI to clearly state when it is unsure or lacks data, so that I don’t blindly trust incorrect advice.

Acceptance Criteria: Given I ask about a fund with insufficient or outdated data, when the AI responds, then it should explicitly state the limitation and avoid giving definitive recommendations

14. As a user, I want to understand that the AI provides guidance, not guaranteed financial advice, so that expectations are clear.

Acceptance Criteria: Given the AI provides investment-related guidance, when the response is displayed, then a brief disclaimer should indicate it is not professional financial advice 

15. As a user, I want the AI to guide me when my portfolio is incomplete, so that I know what information is missing.

 Acceptance Criteria: Given I ask for portfolio-based advice without a saved portfolio, when the AI responds, then it should prompt me to create or complete my portfolio 

## User Stories - Persona based:

1. As a tech-anxious user, I want the AI advisor to explain financial concepts in simple and clear language. So that I can understand investing without feeling overwhelmed.

- Acceptance Criteria: Given I ask the AI advisor a financial question and ask it to explain it simply,
When the AI responds, Then, the explanation should avoid jargon words and use beginner friendly language.

2. As a user unfamiliar with technology, I want a clean and simple interface (e.g. ChatGPT UI). So that I can navigate the app without confusion.

- Acceptance Criteria: Given I navigate between chat history, when I select a prior chat, then the app should clearly indicate which session I am (Highlighted Tab, Session AI / user generated name).

3. As a high earning user with limited time, I want fast data-driven logical investment recommendations. So that I can make informed decisions quickly.

- Acceptance Criteria: Given I ask for investment suggestions, when the AI responds, then it should reference performance metrics of ETFs and mutual funds.

4. As a user familiar with AI tools, I want the system to be transparent on how the recommendations are generated. So that I can trust the advice is transparent.

- Acceptance Criteria: Given I ask about bias, when the AI responds, then it should confirm that recommendations are based solely on performance (of ETF’s and mutual funds).

5. As a university student who works part time and with ‘YOLO’ spending habits, I want the AI to help me set a simple monthly savings goal. So that I can start building better financial habits. 

- Acceptance Criteria: Given I tell the AI I want to save, When I provide my monthly income, then the advice should be a realistic savings amount (e.g. $200 / month).

6. As a cautious first time investor, I want the AI to provide low-risk investment options. So that I can invest without worrying about losing money.

- Acceptance Criteria: Given I indicate that I prefer low-risk, When the AI suggests funds, then it should prioritize low volatility ETF’s or mutual funds, and give warnings for ones that are risky.