# Blood Pressure Dashboard
- This dashboard analyzes blood pressure readings and separates them into raw trends, volatility, and distribution frequency (called histograms) to give different insights.
- It takes raw, intimidating numbers and translates them into easier to understand views of heart health, and behavior over time.
- It is currently a SPA utilizing chart.js and vanilla javascript that reads from a .json file fed from a google sheets Apps Script -> GitHub API.

Visit [https://slashmarkca.github.io/bpDashboard/](https://slashmarkca.github.io/bpDashboard/) to view the dashboard.
(Tip: Right-click the link or hold Ctrl/Cmd to open in a new tab)

Visit [https://slashmarkca.github.io/bpDashboard/](https://slashmarkca.github.io/bpDashboard/) to view the dashboard.

(Tip: Right-click the link or hold Ctrl/Cmd to open in a new tab)

[Contact Me](https://forms.gle/N4FZoaGy3GxCN75P6)  with any questions, or to collaborate.  I am actively seeking medical practitioner feedback as well as code reviews.

## Community Review Invitation
This project is open for community review. I welcome feedback from both medical practitioners and developers — clinical insights, critiques, and technical suggestions are all appreciated.
[Contact Me](https://forms.gle/N4FZoaGy3GxCN75P6) or open a github issue.


## Project History
<details>
  <summary><strong>Click to expand project background</strong></summary>
    
- V1:  I used excel for data and visualization.
- V1.1: Time to go to google sheets as Apps Script can do more and is way more elegant for developing than the Microsoft ecosystem.
- V1.2: I didn't find google charts inside sheets could do what I wanted to.
- V2:  I use tableau, so started there for visualization.  It's more sophisticated for charting, however connectivity to google sheets frequently fails requiring manual data refreshes using the desktop application (bleh), its canvas based layout imposes too many design sacrifices, and gets really laggy as you add more coding and charts. Tableau Public is free (but doesn't have an API so excel->Power Automate->Tableau is out), and Looker is great (but not if you want others to use the dashboard), so there has to be a better way....
- V3:  Here we are today.  A chart.js & vanilla javascript dashboard.  GitHub + GitHub pages to serve, with google sheets as the data source and Apps Script as an ETL layer -> GitHub... nice modern SPA option, no react or node.js required, no database needed since data is minimal enough for .json to handle, and if chart.js can't handle a requirement, there's google and apache charts you can use too!  
</details>


## Why did I build this?
- I had a health event requiring me to buy a cuff and monitor my blood pressure at home.
- I'm a curious guy about my health, can't see my busy doctor often, and have been in tech jobs for over 20 years.
- Other friends I've talked to are curious as well about their heart, and only have a Systolic + Diastolic line graph available, and jumbled spikes tells them nothing.
- I have consulted clinicians in my health team and received "I wish I had xyz instead of doing mental math from raw tabular readings" requirements.
- I'm naturally an analytical thinker, and have been in many data-centric and visualization roles.
- I looked at devices and apps that store data, and they all fall short at analysis and can't answer basic questions the more I do research into heart health - so I built it myself.
- I'm very structured in my thinking as a BA and QA Tester in my career - I don't need expensive HP ALM or Jira licenses so I do see opportunity in github's Issues features!
- I want to stay marketable and upskill constantly in the era of AI disruption, software adjacent landscape, and massive tech layoffs in the 2020's.
- I see opportunity in gaps.
  - There are reading collection methods, but the last mile (getting a usable report into a clinician's hand and even decent analysis) is very broken and differs by device and app manufacturers.
  - Manufacturers are in the business of making the devices, not investing developers, BI platforms, or data integration services.  
  - Devices like Fitbit, Galaxy watches, and blood pressure cuffs do what they do, and it usually ends there.  
  - Apps like PC Health here in Canada, Apple Health and Samsung Health are MOSTLY closed loops. You put data in, and then what? Show your doctor your phone in-person?
  - My healthcare region offers MyChart/Epic access - Their goal is to be a connection between patiends and health care teams - sounds like an awesome idea, so I can abandon this project!  The problem is most doctors aren't on the other end to consume it, and while lab and visit reports contain technical analysis which are a piece of the puzzle, it doesn't have blood pressure, or any "health" features (e.g. Weight, blood oxygenation, diabetes management, etc).


## Features
| Feature | Description |
|--------|-------------|
| Categorization | Reading Categories are very common and recognized by health advocacy organizations and healthcare providers around the world. |
| Analysis Perspectives | Most charts come in pairs: A Time-Series (Line charts showing the "path" of readings) and Summary (called a Histogram or “Box & Whisker” showing the groupings of the heart’s performance). |
| Time Windows | These filters allow you to toggle between seeing immediate reactions (short-term) and identifying sustained patterns (long-term). |
| Reading Comments | Data model accepts an optional field called "Comments" (e.g., "I just worked out") which appears in the chart markers tooltips to help and clinicians explain sudden spikes or dips, or for thoughts for review after the fact (e.g. “I’ve been on a medication for a week and noticed something feels “off”). |
| Informational "Drawers" | Most charts have an information drawer explaining what it is for, on top of a general "How to use this dashboard" explaining calculation "business rules" and nuances. | 
| Design | "Desktop First" with responsive .css and will purposefully avoid being a phone app. |
| Themes | Semantic and element colour coding is separated from the UI layer and controlled from css :root{} and referenced by library functions. "Change once, affect everything". |


## Product Goals
- Start small, invest nothing until a customer critical mass is achieved.
- To make complicated-to-set-up analysis charts something "Your elderly parents could use".
- Use tools people already know how to use (like google sheets, excel, browsers, their wearable devices, their health apps). 
- Design with anticipation to accommodate both heavy and sporadic users.
- Avoid gaps in time-based analysis, and empty charts when viewing after a large period of inactivity - resist Linear Interpolation, Forward Fill, Moving Average or Mean Fill imputation methods.
- Make it work with as few clicks as possible.
- Users shouldn't be forced to, nor do they want to, set up hosting accounts nor download and learn "under the hood" deployments to achieve their goal.
- To educate users on generally accepted clinical benchmarks using their own data ("academia with context"), removing gaps their health network may not explain.
- To make insights available in a manner people can see themselves, and share with their doctor and have a "Here's what I see, what do you think?" conversation.
- To help people feel more informed when seeing a doctor every single day is not feasible.  
- Generate a conversation and improve; invite patients and clinician feedback early.  
- Avoid being a phone-only app  
  - It keeps your data accessible - apps on the market tend to lock a user's own information away out of reach, and stuck in their software should they decide to try something else.
  - Many apps like Facebook serve a purpose well, however analysis should not be trapped and limited in such a small space and difficult to read.  
	  "Browser First" sounds backsards these days, but using responsive .css and ensures users desiring to use a cellphone are able to see their dashboard.
- Avoid additional costs.  Tableau and PowerBI are fine with their own advantages and disadvantages, but using properly would add license costs - for a market this niche though?  Excel is going online only - .vba was great for decades but Office add-ins require a Business edition to use TypeScript so that's out [is that true?  maybe sell an excel add-on at a premium].
- Avoid using spreadsheets as an analytical dashboard.  Just accept it, charts are fragile and limited - it's too easy for a user to inadvertently break things with one click requiring maintenance work, and you can't lock them.
- Be responsible and "stay in your lane" - build with purpose and avoid legal entanglement (HIPPA, PHIPA, CCPA, PIPEDA, GDPR, UK GDPR - it's boring and exhausting but necessary to be aware of).

## License
TBD


========================================================================================
# h1
Text.
## h2
Text
### h3
Text.

- Feature A
    - Subfeature A1
  - Subfeature A2
 
<details>
  <summary>Technical Details</summary>
  
  - Architecture: SPA
  - Charts: Canvas API
  - Data Model: JSON-based
</details>


- [x] Completed task
- [ ] Incomplete task

Another H1 way.
===================================================
Looks like how I type in notepad.

Another H2 way.
----------------------
* asterisks for bullets too
  * Can't indent with tabs and hyphens.

    code

1. Item
2. Item
 * Mixed
 * Mixed
3. Item


<hr />


## Overview
A short explanation of:
- what the project does  
- the problem it solves  
- who benefits from it  

Keep this section tight and reader‑friendly.

## Features
### User‑Facing Features
- Feature 1  
- Feature 2  
- Feature 3  
  - Subfeature A  
  - Subfeature B  

### Clinical / Domain Features
- Clinical insight 1  
- Clinical insight 2  
- Workflow considerations  
- Data interpretation logic  

---

## Technical Features
### Architecture
- SPA structure  
- Data flow  
- Component layout  

### Technologies Used
- JavaScript / Python / etc.  
- Charting library or Canvas API  
- Build tools  
- Any notable patterns  

### Data Model
- How data is structured  
- How it’s validated  
- Any domain‑specific logic  


## Roadmap
- Planned feature A  
- Planned feature B  
- Planned refactor  
- Clinical validation steps  
<<<<<<< Updated upstream
- UI/UX improvements  

---

## Community Review Invitation
This project is open for community review. I welcome feedback from both medical practitioners and developers — clinical insights, critiques, and technical suggestions are all appreciated.

If you’d like to contribute your expertise, feel free to open a discussion, file an issue, or comment directly on the repository.


## License
MIT / Apache / etc.
<!--stackedit_data:
eyJoaXN0b3J5IjpbOTMxNDEzNDc4LC0xOTk5NTk3MjMsLTE5Nz
c5MzkyMDddfQ==
-->
=======
- UI/UX improvements  
>>>>>>> Stashed changes
