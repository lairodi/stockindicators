## Description

The software package consists of a server-side component and client-side component.

### Server-side Component

The server-side component is a python-flask webservice RESTful API. The API and documentation were generated using swaggerhub.
The python environment is 3.7+ with the following required packages:
 - connexion with swagger-ui version 2.6.0 (flask RESTful web API)
 - numpy version 1.18.2
 - scikit-learn version 0.22.1 (Used for Random Forest Classifier)
 - pandas version 1.0.3 (data manipulation of stock data set)
 - scipy version 1.4.1
 - alpha-vantage version 2.1.3 (used to retrieve stock data from Alphavantage web API)

To use alpha-vantage API keys need to be generated from the following link:
https://www.alphavantage.co/support/#api-key

To work around free account limits of alpha-vantage each group member generated at least one key for a total of 6 keys.
List of keys can be placed under source/datavengers_202/utils/helper.py on line 13
ALPHA_VANTAGE_API_KEYS = ["list", "of", "keys"]

For convenience we have left the group keys in code.

The Simulation engine is composed of a simulation manager class that downloads and processes the stock data. 
Simulations are done by either a Random Forest classifier or a Q-Learning/Agent.

### Client-side Component

The client-side component was developed in html, CSS, and JavaScript. The main visualization was done using D3 JavaScript library.
The client-side makes RESTful API calls to the server-component to get stock data and run the simulation engine and get simulation results.

## Installation

The simplest way to run the code is to use Docker. A Docker image is provided. 
The Docker image will download an ubuntu base image with python 3.8 installed.
It will then install all the python package requirements under the requirements.txt located
at the root directory. It will then copy the source code and copy it to the Docker image.

### Running with Docker

**To run Docker on windows, windows 10 pro with virtualization is required.

To run the server on a Docker container, please execute the following from the downloaded Code directory:
(internet connection is required)

```bash
# building the image - for windows
docker build -t datavengers_2020 .

# building the image - for mac
docker build . -t datavengers_2020

# starting up a container
docker run -p 8080:8080 datavengers_2020
``` 

## Execution

Once the docker image is successfully running open either firefox or chrome browser
and navigate to localhost:8080. The webapp client-side application will load.

Link to YouTube Video:
https://youtu.be/ocjdWQUKBXA
