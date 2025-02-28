import React from 'react';

const Guide: React.FC = () => {
  return (
      <div className="guide-container">
        <h1>Beginner's Guide to Contributing (Using GitHub UI Editor)</h1>
        <ul>
          <li>
            <h2>Step 1: Create a GitHub Account</h2>
            <p>If you don't have a GitHub account, you can easily create one by going to <a href="https://github.com" target="_blank" rel="noopener noreferrer">https://github.com</a>.</p>
            <p>Click on the "Sign Up" button and follow the instructions. After creating your account, you’ll be able to fork repositories, make pull requests, and contribute to open-source projects.</p>
            <p>A better guide can be found <a href="https://devduffy.hashnode.dev/how-to-create-a-github-account" target="_blank" rel="noopener noreferrer">here</a> to create an account</p>
          </li>
          <li>
            <h2>Step 2: Fork the Repository</h2>
            <img src="https://cdn.hack.pet/slackcdn/c4fbd1044a1a3107ce9536cd16288000.png" alt="Fork" />
            <p>Go to the repository page on GitHub. Click on the "Fork" button at the top right corner of the page. This will create a copy of the repository under your GitHub account.</p>
          </li>
          <li>
            <h2>Step 3: Edit the JSON File Using GitHub's UI</h2>
            <img src="https://cdn.hack.ngo/slackcdn/490cf7d121a05b375d22fd4d2aff03e1.png" alt="Edit JSON" />
            <p>Go to your forked repository on GitHub. Navigate to the <code>src/data/projects.json</code> file and click the "pencil" icon to edit it directly in the GitHub UI.</p>
            <p>In the editor, add your project details following the existing structure [Keep tags to a max of 3]:</p>
            <pre>
            <code>
              {`{
  "id": "unique-id",
  "name": "Project Name",
  "description": "Project description",
  "imageUrl": "https://example.com/image.jpg",
  "tags": ["React", "TypeScript"],
  "rank": "🥇",
  "githubUrl": "https://github.com/...",
  "demoUrl": "https://demo.example.com"
}`}
            </code>
          </pre>
          </li>
          <li>
            <h2>Step 4: Commit Your Changes</h2>
            <img src="https://cdn.fluff.pw/slackcdn/35164e32614712a845fc27e7c46dda7b.png" alt="Commit" />
            <p>After editing the JSON file, scroll down to the "Commit changes" section. Provide a commit message like "Add new project to the showcase" and choose the option to commit directly to the <code>main</code> branch.</p>
          </li>
          <li>
            <h2>Step 5: Open a Pull Request</h2>
            <img src="https://cdn.hack.pet/slackcdn/59f7ceb0c80a946e0427d006d693a844.png" alt="Pull Request" />
            <p>After committing your changes, go to the "Pull requests" tab in your forked repository. Click the "New pull request" button. GitHub will automatically compare the changes you've made in your fork with the original repository.</p>
            <p>Provide a descriptive title and description for your pull request, then click "Create pull request".</p>
          </li>
          <li>
            <h2>Step 6: Wait for Review</h2>
            <p>An admin will review your pull request. They may accept it, request changes, or edit it for you. Be patient and responsive to any feedback.</p>
          </li>
          <li>
            <h2>Step 7: Once it is Accepted</h2>
            <p>If accepted, you will earn 5 scraps as a reward!!</p>
          </li>
        </ul>
      </div>
  );
};

export default Guide;
