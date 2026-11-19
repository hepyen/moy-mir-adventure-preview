/** Pre-rendered British English examples: included offline in the app. */
export const ENGLISH_AUDIO_EXAMPLES:Record<string,string>={
  "I am twelve.": "/english/audio/66d56953cf078f05.mp3",
  "She is at school.": "/english/audio/0d7fbe79b5abe719.mp3",
  "They are happy.": "/english/audio/a7f03c5c78e4d6f5.mp3",
  "I have got a dog.": "/english/audio/531f9b0b441688d3.mp3",
  "She has got two books.": "/english/audio/dbe6bb3922b3afb7.mp3",
  "Have you got a pen?": "/english/audio/d9d962312a06b083.mp3",
  "I read every day.": "/english/audio/9c15dd8c1f9b0502.mp3",
  "He goes to school.": "/english/audio/d0c28ed8aadc0c19.mp3",
  "Does she like music?": "/english/audio/e67ed9ed313cc183.mp3",
  "I am learning English now.": "/english/audio/9f9eca1d9eb3f794.mp3",
  "She is writing a message.": "/english/audio/1389a3920e83537a.mp3",
  "They are playing outside.": "/english/audio/afcd47dedd3388a3.mp3",
  "There is a desk in my room.": "/english/audio/f41e649e4c9e2369.mp3",
  "There are three windows.": "/english/audio/d1d12ac52d68a55d.mp3",
  "Is there a garden?": "/english/audio/9f22294d2781dc3f.mp3",
  "I visited my friend yesterday.": "/english/audio/2c88328e3c4a5e9d.mp3",
  "We went to the park.": "/english/audio/cbdbab85d59183b2.mp3",
  "Did you watch the film?": "/english/audio/82c510c0658183a9.mp3",
  "My timetable starts at eight.": "/english/audio/4c7d87ef15fd9d64.mp3",
  "I put my books in my backpack.": "/english/audio/96905563302a3c25.mp3",
  "I have lunch at home.": "/english/audio/6b8ef8ee9c952a81.mp3",
  "Where do you live?": "/english/audio/b1c92dccb26c630b.mp3",
  "What time is it?": "/english/audio/c4f844f58ce0b3a2.mp3",
  "How are you?": "/english/audio/1fec6e5efe87db69.mp3"
}
export const exampleAudioUrl=(phrase:string)=>ENGLISH_AUDIO_EXAMPLES[phrase.trim()]??null
