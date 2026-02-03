# CSV Imports

This document defines the CSV formats used by the Import page, aligned with the data model in datamodel.puml.

- File encoding: UTF-8
- Line endings: LF or CRLF
- Delimiter: comma `,`
- Header row: required (exact column names)
- Preview limits to first 10 data rows

## Students (Student)
Required headers:
- first_name
- last_name
- if_name

Example:
first_name,last_name,if_name
Anna,Weber,5AHIF
Tom,Fischer,5AHIF

## Professors (Professor)
Required headers:
- first_name
- last_name

Example:
first_name,last_name
Max,Müller
Maria,Schmidt

<!-- Projects import temporarily disabled. -->

<!-- The system currently supports CSV imports for Students, Professors, and Projects only. -->

## Downloading Templates
On the Import page, use the “Download Template” button in each tab to get a starter CSV with the correct headers.
