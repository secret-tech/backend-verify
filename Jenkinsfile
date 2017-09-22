pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'docker-compose build -f docker-compose.prod.yml'
      }
    }
    stage('Deploy') {
      steps {
        sh 'docker-compose push -f docker-compose.prod.yml'
      }
    }
  }
}