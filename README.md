[![Build Status](https://github.com/water-fountains/datablue/actions/workflows/build-ubuntu.yml/badge.svg)](https://github.com/water-fountains/datablue/actions/workflows/build-ubuntu.yml)

# datablue

Datablue is a server for collecting, aggregating, and serving open data. It is written using NodeJS and Express.
It is being developed in conjunction with [Proximap](//github.com/water-fountains/proximap), a responsive web app for finding nearby public infrastructure, using drinking fountains as a showcase example. Check out [water-fountains.org](//water-fountains.org)
for more information on the overall project.

The project is open source under the GNU Affero General Public License, with a profit contribution agreement applying under restricted conditions. See [COPYING](/COPYING) for information.

## Vision

Datablue will consist in a collection of scripts and data structures for collecting and manipulating data, which can be executed on a schedule to generate an always up-to-date consolidated dataset.

![data processing](https://www.lucidchart.com/publicSegments/view/fbd5eb93-ad45-4c2f-9502-17792052a63a/image.png)
View the data processing concept [here](https://www.lucidchart.com/invitations/accept/24f813e7-3d79-4de6-90bc-a3bfbe8d8cbf). See the [docs](/docs/components.md) for planned components.

# Running the project locally

1. Requirements (make sure these are up to date)
   - <a href="https://nodejs.org" target="_blank">NodeJS</a> is a JavaScript runtime.
   - <a href="https://git-scm.com/" target="_blank">Git</a> is a version control system you will need to have available as a command line executable on your path. A git integrated in your IDE will not be sufficient (and may cause issues).
   - Around 200MB of space on your disk. The project has development dependencies that are downloaded when you run `> npm install` (see point 3).
2. Clone this repository to a local project directory. Checkout the `develop` branch to get all the latest features. The `stable` branch is updated at a less frequent interval to guarantee stability.
   - run `> git clone https://github.com/water-fountains/datablue.git -b develop`.
3. Open a command line in the local project directory
   - Install required node packages: run `> npm install`. On Windows a warning will appear about an optional package that is required for Mac. This is normal but you can use `> npm install --force` if you don't want to see it.
   - Create a copy of the environment file `> cp .envTEMPLATE .env`
4. In the newly copied `.env` file, set the following variable:
   - `GOOGLE_API_KEY=[mykey]` get a Google Maps API key and set it in the place of `[mykey]`. This is optional but required in order to see Google Street View images.
5. Run it by running `` > npm run dev 2>&1 | tee npm_db_`date +%y%m%d_%H%M%S`.log `` in the local project directory.
6. Try it: Point your browser to <a href="http://localhost:3000" target="_blank" >http://localhost:3000</a>

_Note: when you update your local project with `git pull`, make sure you run `npm install` again to update any packages that were changed._

With the chrome browser, you can step through the code by placing `chrome:inspect` in the address bar (provided you `npm run debug`).

210425: on debian, I had the problem: https://github.com/nodejs/node/issues/26887 despite chrome being on v 87.0.4280.88 (Official Build) (64-bit) and node on v14.15.4

`~/git/datablue$ node --inspect build/main.js dev`
did work (load front-end also via chrome), but did not recompile main.js

# Running the project in _production_ mode:

If you want to run it over https, then you need a private key `privkey.pem` and certificate `cert.pem` for encryption located in the root of your project.

Alternatively, you can store the `privkey.pem` and `cert.pem` in the directory `/etc/letsencrypt/live/water-fountains.org/`

run `npm run init_symlink_server` which sets up a symbolic link in your root to
`/etc/letsencrypt/live/water-fountains.org/`

Then run

```bash
npm install
npm run compile
pm2 start build/main.js --name "datablue"
```

Note: In production mode, the endpoint is only available over https if a `privkey.pem` and `cert.pem` is defined and can be read by the process running pm2.

# Deployment

Each merge to `develop` will automatically trigger a deployment via [Github Actions](https://github.com/water-fountains/datablue/runs/2485907077?check_suite_focus=true#step:10:144) to https://api.beta.water-fountains.org where you can verify the current version via the build-info endpoint: https://api.beta.water-fountains.org/api/v1/build-info

Likewise, each merge to `stable` will automatically trigger a deployment to https://api.water-fountains.org.

# Contributing

Submit an issue for a feature request, architecture suggestion, or to discuss a modification you have made or would like to make.

If you would like to contribute directly to the code:

- fork this repo
- checkout the `develop` branch
- create a new branch `feature/[yourFeatureName]`
- make your changes and test them thoroughly. Commit them to your fork of the project
- run `npm run pr` (pr = pull request) before you commit which will format the source code and run the linter
- make a pull request

To get ideas for what features to develop, check out the repository issues.

To add a fountain property to be processed and made available by datablue, check this guide: [Guide: include a new fountain property (operator id) in the processing pipeline](<https://github.com/water-fountains/datablue/wiki/Guide:-include-a-new-fountain-property-(operator-id)-in-the-processing-pipeline>)
