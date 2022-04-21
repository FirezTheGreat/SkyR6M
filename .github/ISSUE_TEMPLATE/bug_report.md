---
name: Bug report
about: Report incorrect or unexpected behavior of code
title: ''
labels: bug
assignees: FirezTheGreat

---

body:
   - type: textarea
      id: description
      attributes:
         label: Issue
         description: |
            Describe the issue in detail.
            Note: You can attach images.
         placeholder: |
            Steps to reproduce with below code sample:
            1. Go in '...'
            2. Click on '....'
            3. Scroll down to '....'
            4. See error
      validations:
         required: true
   - type: textarea
      id: code
      attributes:
      label: Code
      description: Include a reproducible, code sample. Do not use backticks to format
      render: javascript
      placeholder: |
         Use the precise code sample that triggers the issue
