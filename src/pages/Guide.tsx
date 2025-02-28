import React from 'react';

const Guide: React.FC = () => {
  return (
    <div className="guide-container">
      <h1>Beginner's Guide to Contributing</h1>
      <ol>
        <li>
          <h2>Step 1: Fork the repository</h2>
          <img src="https://example.com/fork.png" alt="Fork" />
          <p>Go to the repository page on GitHub. Click on the "Fork" button at the top right corner of the page. This will create a copy of the repository under your GitHub account.</p>
        </li>
        <li>
          <h2>Step 2: Clone the repository</h2>
          <img src="https://example.com/clone.png" alt="Clone" />
          <p>Open your terminal or command prompt. Run the following command to clone the repository to your local machine:</p>
          <pre>
            <code>git clone https://github.com/yourusername/project-showcase.git</code>
          </pre>
          <p>Navigate to the cloned repository directory:</p>
          <pre>
            <code>cd project-showcase</code>
          </pre>
        </li>
        <li>
          <h2>Step 3: Modify the JSON file</h2>
          <img src="https://example.com/edit-json.png" alt="Edit JSON" />
          <p>Open the <code>src/data/projects.json</code> file in your preferred code editor. Add your project details following the existing structure:</p>
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
          <h2>Step 4: Commit your changes</h2>
          <img src="https://example.com/commit.png" alt="Commit" />
          <p>Stage the changes:</p>
          <pre>
            <code>git add src/data/projects.json</code>
          </pre>
          <p>Commit the changes with a descriptive message:</p>
          <pre>
            <code>git commit -m "Add new project to the showcase"</code>
          </pre>
        </li>
        <li>
          <h2>Step 5: Push the changes</h2>
          <img src="https://example.com/push.png" alt="Push" />
          <p>Push the changes to your forked repository:</p>
          <pre>
            <code>git push origin main</code>
          </pre>
        </li>
        <li>
          <h2>Step 6: Open a pull request</h2>
          <img src="https://example.com/pull-request.png" alt="Pull Request" />
          <p>Go to your forked repository on GitHub. Click on the "Compare & pull request" button. Provide a descriptive title and description for your pull request. Click on the "Create pull request" button.</p>
        </li>
        <li>
          <h2>Step 7: Wait for review</h2>
          <img src="https://example.com/review.png" alt="Review" />
          <p>An admin will review your pull request. They may accept it, request changes, or edit it for you. Be patient and responsive to any feedback.</p>
        </li>
      </ol>
    </div>
  );
};

export default Guide;
