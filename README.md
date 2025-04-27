# Zenya Nails & Spa React App

This is an app created for **Zenya Nails & Spa** store that promotes nails and spa services.  
It was built using React and Create React App.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode.  
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.  
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.  
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.  
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.  
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run lint`

Checks the code quality using ESLint and Prettier rules.  
This command will validate:
- Syntax errors
- Formatting consistency (spacing, semicolons, quotes)
- React best practices
- File and variable naming conventions

If any errors are found, they will be displayed in the console.

You can also automatically fix many issues by running:

```bash
npx eslint src --ext .js,.jsx,.ts,.tsx --fix
```

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc.) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However, we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Code Quality and Linting Setup

This project uses **ESLint** and **Prettier** to enforce code quality and style guidelines automatically.

### How it works

- Every Pull Request automatically runs the linter via **GitHub Actions**.
- PRs are blocked if any lint errors are detected.
- This ensures consistent, clean, and professional code across the project.

### Verifying Locally

Before opening a Pull Request, you can verify your code by running:

```bash
npm run lint
```

- If no issues are found, your code is ready.
- If issues are found, they will be printed in the terminal.

You can also automatically fix many issues by running:

```bash
npx eslint src --ext .js,.jsx,.ts,.tsx --fix
```

### Common Errors and How to Fix

| Error Type | How to fix |
|:---|:---|
| Missing semicolons, wrong quotes, wrong spacing | Run `npx eslint src --ext .js,.jsx,.ts,.tsx --fix` |
| Wrong file or variable naming (e.g., `App.test.js` vs `app-test.js`) | Rename files or variables to match project conventions (lowercase, kebab-case, etc.) |
| React function component not using arrow functions | Convert your function components to arrow functions (`const MyComponent = () => {}`) |
| Undefined `test` or `expect` in test files | ESLint is configured to recognize Jest automatically; if issues persist, check the test file setup. |

### GitHub Actions

- Linting runs on **every Pull Request** automatically.
- If linting fails, you must fix the issues before merging.

## Pull Request Checklist

Before submitting a Pull Request, please verify:

- [ ] I have run `npm run lint` and confirmed there are no errors.
- [ ] I have fixed all linting and formatting issues.
- [ ] I have tested the app locally and confirmed all features work correctly.
- [ ] I have provided a clear and descriptive Pull Request title and description.
- [ ] (Optional) I have updated the README or documentation if necessary.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

## Additional Resources

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React Documentation](https://reactjs.org/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/index.html)

testing jira integration