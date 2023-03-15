## Project Setup

In order to run the project, setup .env and set MONGO_URI variable equal to DB connection string.

In order to avoid port collisions, in the source code port value is 5000

1  git satus on master

2  git pull on master

3  git checkout pw-dev 

4  git add .

5  git commit -m "accounts.js file update"

6  git checkout master

7  git merge pw-dev

8  git push

9  git checkout pw-dev

10 git push origin pw-dev
