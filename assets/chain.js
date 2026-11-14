// The Chain of Witnesses: who knew whom among the early witnesses, drawn as threads graded by how well each link is attested.
// Loaded on demand by app.js for /chain; LUX.chain.render(view, params, onCleanup) draws the page.
(() => {
const N_ALL = {
  jesus:     { name: "Jesus", date: "d. c. AD 30–33", yr: 23, lane: 3.4, img: "e-jesus-pantocrator", root: true, face: [153 / 343, 182 / 640, 1.12, 640 / 343],
               bio: "Teacher from Nazareth, crucified in Jerusalem under Pontius Pilate. Every thread on this chart begins with the people who followed him." },
  peter:     { name: "Peter", ap: true, date: "d. c. 64–68", yr: 52, lane: 1.5, img: "c-peter",
               bio: "Fisherman of Galilee and leader of the Twelve. Paul met him in Jerusalem; early tradition places his death in Rome under Nero." },
  john:      { name: "John", ap: true, date: "d. c. 100?", yr: 64, lane: 3.4, img: "c-john",
               bio: "Son of Zebedee, one of the Twelve and, with Peter and James, a 'pillar' of the Jerusalem church. Second-century tradition has him living to old age at Ephesus." },
  paul:      { name: "Paul", ap: true, date: "d. c. 64–67", yr: 54, lane: 5.4, img: "c-paul",
               bio: "Pharisee turned apostle. His letters, written c. AD 48–60s, are the earliest Christian documents to survive." },
  mark:      { name: "Mark", ap: true, date: "fl. 50s–60s", yr: 70, lane: 0.3, img: "c-mark",
               bio: "John Mark of Jerusalem, cousin of Barnabas. A companion of Paul, later linked with Peter, and traditionally the author of the second Gospel." },
  luke:      { name: "Luke", ap: true, date: "fl. 50s–80s", yr: 78, lane: 6.5, img: "c-luke",
               bio: "Physician and travelling companion of Paul; traditionally the author of the Gospel of Luke and the Acts of the Apostles." },
  clement:   { name: "Clement of Rome", date: "fl. c. 96", yr: 98, lane: 2.3, img: "c-clement",
               bio: "A leader of the church at Rome. His letter to the Corinthians, c. AD 96, is the earliest Christian writing outside the New Testament." },
  ignatius:  { name: "Ignatius", date: "d. c. 110", yr: 108, lane: 5.2, img: "c-ignatius",
               bio: "Bishop of Antioch. Under arrest on the road to Rome, he wrote seven letters, one of them to Polycarp." },
  papias:    { name: "Papias", date: "fl. c. 110–130", yr: 120, lane: 1.4, mono: "P",
               bio: "Bishop of Hierapolis in Asia Minor. He collected what the apostles' followers remembered; his books are lost and survive only in quotations." },
  polycarp:  { name: "Polycarp", date: "c. 69–155", yr: 128, lane: 3.4, img: "e-polycarp",
               bio: "Bishop of Smyrna, martyred at eighty-six. The best-attested living link between the apostles and the later church." },
  justin:    { name: "Justin Martyr", date: "c. 100–165", yr: 152, lane: 5.6, img: "e-justin-martyr",
               bio: "Philosopher and teacher in Rome who described Christian worship and the 'memoirs of the apostles'. Executed c. AD 165." },
  tatian:    { name: "Tatian", date: "fl. c. 170", yr: 172, lane: 6.6, mono: "T",
               bio: "Justin's student. His Diatessaron wove the four Gospels into one account, which shows all four were already recognised." },
  irenaeus:  { name: "Irenaeus", date: "c. 130–202", yr: 182, lane: 3.4, img: "c-irenaeus",
               bio: "Bishop of Lyon. As a boy in Smyrna he heard Polycarp; his Against Heresies, c. AD 180, names the authors of all four Gospels." },
  hippolytus:{ name: "Hippolytus", date: "c. 170–235", yr: 220, lane: 2.3, img: "c-hippolytus", credit: "Photo: Dobroš (Dana Stehlíková), CC BY-SA 4.0",
               bio: "Presbyter and theologian in Rome, the most prolific writer of the Roman church in the early third century." },
  pantaenus: { name: "Pantaenus", date: "fl. c. 180", yr: 180, lane: 0.3, img: "c-pantaenus",
               bio: "Head of the Christian school at Alexandria in the late second century. None of his writings survives." },
  clementA:  { name: "Clement of Alexandria", date: "c. 150–215", yr: 206, lane: 1.0, img: "c-clementA",
               bio: "Teacher at Alexandria whose Stromata quotes widely from the Gospels and from earlier Christian writers." },
  origen:    { name: "Origen", date: "c. 185–253", yr: 236, lane: 0.3, img: "e-origen",
               bio: "The greatest Christian scholar of his age, at Alexandria and later Caesarea. He compared manuscripts of the Bible in several languages." },
  james:      { name: "James", date: "d. AD 62", yr: 46, lane: 4.4, img: "c-james", more: true,
                bio: "Brother of Jesus and leader of the Jerusalem church. Paul met him twice and lists him among those who saw the risen Jesus; Josephus records his execution in AD 62." },
  barnabas:   { name: "Barnabas", date: "fl. c. 36–50", yr: 45, lane: 6.5, vyr: 42, img: "c-barnabas", more: true,
                bio: "Levite from Cyprus who introduced Paul to the apostles and travelled with him from Antioch. Mark was his cousin and later his companion." },
  timothy:    { name: "Timothy", date: "fl. 50s–60s", yr: 72, lane: 4.8, img: "c-timothy", more: true,
                bio: "Paul's closest co-worker, from Lystra in Asia Minor. He is named as co-sender of six of Paul's letters and carried Paul's messages to Thessalonica and Corinth." },
  silvanus:   { name: "Silvanus", date: "fl. 50s", yr: 70, lane: 7.4, vyr: 52, img: "c-silvanus", more: true,
                bio: "Co-sender of Paul's two letters to Thessalonica, usually identified with the Silas of Acts who left Jerusalem with Paul. 1 Peter names a Silvanus as its bearer or secretary." },
  linus:      { name: "Linus of Rome", date: "fl. c. 67–79", yr: 80, lane: 0.6, vyr: 86, img: "c-linus", more: true,
                bio: "Named by Irenaeus as the first to lead the church at Rome after the apostles. Nothing of his own survives, and the earliest Roman lists do not agree about the order." },
  anicetus:   { name: "Anicetus of Rome", date: "bishop c. 155–166", yr: 150, lane: 2.3, img: "c-anicetus", more: true,
                bio: "Bishop of Rome in the 150s. Two visitors from the East, Polycarp and Hegesippus, record meeting him; with Polycarp he disagreed over the date of Easter and parted in peace." },
  hegesippus: { name: "Hegesippus", date: "fl. c. 160–180", yr: 170, lane: 4.8, mono: "He", more: true,
                bio: "Traveller and collector of traditions, probably of Jewish birth. His five books of Memoirs are lost; Eusebius quotes them for the death of James and the early church of Jerusalem." },
  florinus:   { name: "Florinus", date: "fl. c. 180–190", yr: 172, lane: 1.9, mono: "F", more: true,
                bio: "Presbyter at Rome who had sat with Irenaeus at Polycarp's feet as a young man. When he turned to Valentinian teaching Irenaeus wrote to remind him what Polycarp had taught." },
  africanus:  { name: "Julius Africanus", date: "c. 160–c. 240", yr: 242, lane: 4.6, mono: "J", more: true,
                bio: "Christian scholar from Palestine who wrote the first Christian world chronicle. He heard Origen debate, and the two exchanged letters about the story of Susanna in Daniel." },
  dionysiusA: { name: "Dionysius of Alexandria", date: "d. c. 264", yr: 260, vyr: 254, lane: 0.9, img: "c-dionysiusA", more: true,
                bio: "Head of the Alexandrian school and then bishop of Alexandria for seventeen years. Eusebius drew on his letters for a whole book of the Church History." },
  gregory:    { name: "Gregory Thaumaturgus", date: "c. 213–270", yr: 262, vyr: 274, lane: 3.4, img: "c-gregory", more: true,
                bio: "Born Theodore, a law student from Pontus who spent five years with Origen at Caesarea and left a speech of thanks to him. With his brother Athenodorus he became a bishop in Pontus." },
  pierius:    { name: "Pierius", date: "fl. c. 280–300", yr: 288, lane: 0.3, mono: "Pi", more: true,
                bio: "Presbyter and teacher at Alexandria, called 'Origen the younger' for his learning. Eusebius knew him; later tradition makes him the teacher of Pamphilus." },
  pamphilus:  { name: "Pamphilus", date: "d. 310", yr: 300, lane: 1.8, mono: "Pa", more: true,
                bio: "Presbyter of Caesarea who copied Origen's works in his own hand and built the library there. Martyred in 310; Eusebius wrote his life and took his name." },
  eusebius:   { name: "Eusebius of Caesarea", date: "c. 260–339", yr: 318, lane: 3.4, img: "c-eusebius", more: true,
                bio: "Bishop of Caesarea and the first historian of the church. Nearly every quotation on this chart from Papias, Hegesippus or Irenaeus's letters survives because he copied it into his Church History." },
  mary:       { name: "Mary Magdalene", date: "fl. c. 30", yr: 41, lane: 0.3, vyr: 44, img: "c-mary", more: true,
                bio: "Mary of Magdala on the Sea of Galilee, who followed Jesus from Galilee and stood by at the cross. All four Gospels put her at the tomb on the first day of the week; in John she is the first to see the risen Jesus and the first to tell the others." },
  philip:     { name: "Philip", date: "fl. c. 35–60", yr: 84, lane: 3.8, vyr: 88, img: "c-philip", more: true,
                bio: "Philip the evangelist, one of the Seven chosen in Jerusalem, who preached in Samaria and settled at Caesarea, where his four daughters prophesied. Writers in Asia a century later placed him and his daughters at Hierapolis and called him an apostle; the daughters were still telling their stories to Papias." },
  titus:      { name: "Titus", date: "fl. 50s", yr: 71, lane: 2.3, vyr: 80, img: "c-titus", more: true,
                bio: "Greek convert and Paul's envoy to Corinth, whom Paul took to Jerusalem uncircumcised as a test case. The letter to Titus places him in Crete, where Eusebius says he led the churches." },
  onesimus:   { name: "Onesimus of Ephesus", date: "fl. c. 110", yr: 114, lane: 7.0, vyr: 116, mono: "O", more: true,
                bio: "Bishop of Ephesus when Ignatius passed through Asia under guard. He led the delegation that met Ignatius at Smyrna and is praised at the head of the letter Ignatius sent back. Whether he is the runaway slave of Paul's letter to Philemon, grown old, is a modern guess." },
  ammonius:   { name: "Ammonius Saccas", date: "d. c. 242", yr: 215, lane: 5.0, vyr: 212, mono: "Am", more: true,
                bio: "Philosopher at Alexandria who taught Plotinus and, by Porphyry's account, Origen. Porphyry says he was born a Christian and left the faith; Eusebius, who may have confused him with a Christian writer of the same name, says he never did." },
  priscilla:  { name: "Priscilla and Aquila", date: "fl. c. 50–57", yr: 54, lane: 7.1, vyr: 60, img: "c-priscilla", more: true,
                bio: "Jewish tentmakers expelled from Rome under Claudius, Paul's hosts at Corinth and his companions at Ephesus, where their house was a church. Paul calls them his 'helpers in Christ Jesus'; Acts says they taught Apollos." },
  apollos:    { name: "Apollos", date: "fl. c. 52–55", yr: 62, lane: 6.5, vyr: 70, mono: "Ap", more: true,
                bio: "Alexandrian Jew, 'an eloquent man, and mighty in the scriptures', who came to Ephesus knowing only John's baptism and went on to teach at Corinth, where some called themselves his party. Paul counted him a fellow worker." },
};
const E_ALL = [
  { a: "jesus", b: "peter", g: 1, quote: "He was seen of Cephas, then of the twelve.", cite: "Paul, 1 Corinthians 15:5 (c. AD 54)",
    text: "Peter's place as the first of Jesus's disciples is stated in all four Gospels and, earlier still, in Paul's letters." },
  { a: "jesus", b: "john", g: 1, quote: "And going on a little farther, he saw James the son of Zebedee, and John his brother… and straightway he called them.", cite: "Mark 1:19–20",
    text: "John and his brother James are among the first called in every Gospel account. Paul names John as one of the three 'pillars' of the Jerusalem church (Galatians 2:9)." },
  { a: "jesus", b: "paul", g: 1, quote: "And last of all he was seen of me also, as of one born out of due time.", cite: "Paul, 1 Corinthians 15:8",
    text: "Paul never followed Jesus during his ministry. This thread is his own claim to have seen the risen Jesus, which he places last in the list of appearances." },
  { a: "paul", b: "peter", g: 1, met: true, quote: "Then after three years I went up to Jerusalem to see Peter, and abode with him fifteen days.", cite: "Paul, Galatians 1:18",
    text: "Paul's own account of meeting Peter, about three years after his conversion: a first-hand statement in one of his undisputed letters." },
  { a: "paul", b: "john", g: 1, met: true, quote: "James, Cephas, and John, who seemed to be pillars, gave to me and Barnabas the right hands of fellowship.", cite: "Paul, Galatians 2:9",
    text: "On a later visit to Jerusalem Paul met John in person, along with Peter and James the brother of Jesus." },
  { a: "paul", b: "mark", g: 1, quote: "Marcus, Aristarchus, Demas, Lucas, my fellowlabourers.", cite: "Paul, Philemon 24",
    text: "Mark appears as Paul's co-worker in Philemon, one of the undisputed letters, and again in Colossians 4:10 as 'sister's son to Barnabas'." },
  { a: "paul", b: "luke", g: 1, quote: "Luke, the beloved physician, and Demas, greet you.", cite: "Colossians 4:14; see also Philemon 24",
    text: "Luke is named with Paul in three letters. The 'we' passages of Acts, where the narrator travels with Paul, point the same way." },
  { a: "peter", b: "mark", g: 2, quote: "Mark, having become the interpreter of Peter, wrote down accurately, though not in order, whatsoever he remembered of the things said or done by Christ.", cite: "Papias, c. AD 110–130, quoted by Eusebius, Church History 3.39.15",
    text: "Papias reports this from 'the Elder', a teacher of the generation that knew the apostles. 1 Peter 5:13 also calls Mark 'my son'.",
    note: "Most scholars accept that Papias wrote this; they differ on how much weight his source deserves." },
  { a: "peter", b: "clement", g: 2, quote: "This man, as he had seen the blessed apostles, and had been conversant with them, might be said to have the preaching of the apostles still echoing in his ears.", cite: "Irenaeus, Against Heresies 3.3.3 (c. AD 180)",
    text: "Clement's own letter speaks of Peter and Paul as 'the noble examples of our own generation'. Irenaeus says he had known them." },
  { a: "paul", b: "clement", g: 2, quote: "This man, as he had seen the blessed apostles, and had been conversant with them…", cite: "Irenaeus, Against Heresies 3.3.3",
    text: "Clement writes of Paul's death as a recent event of his own generation (1 Clement 5). Origen later identified him with the Clement whom Paul greets in Philippians 4:3.",
    note: "The Philippians identification is a later guess; the link through the Roman church is the stronger part." },
  { a: "peter", b: "ignatius", g: 3, quote: "Ignatius was appointed bishop of Antioch by the hand of the great Peter.", cite: "Theodoret, 5th century (paraphrased)",
    text: "Writers of the fourth and fifth centuries say the apostles, or Peter himself, appointed Ignatius. Other late traditions call him a disciple of John.",
    note: "Ignatius's own letters never claim personal contact with an apostle, so this thread is weak." },
  { a: "john", b: "polycarp", g: 2, quote: "I can describe the very place in which the blessed Polycarp used to sit when he discoursed… and how he would speak of his familiar intercourse with John, and with the rest of those who had seen the Lord.", cite: "Irenaeus, Letter to Florinus, quoted by Eusebius, Church History 5.20.6",
    text: "Irenaeus heard this from Polycarp in person. He also writes that Polycarp 'was instructed by apostles, and conversed with many who had seen Christ'." },
  { a: "polycarp", b: "irenaeus", g: 1, quote: "Polycarp… whom I also saw in my early youth, for he tarried a very long time.", cite: "Irenaeus, Against Heresies 3.3.4",
    text: "Irenaeus's own testimony: as a boy in Smyrna he listened to Polycarp teach." },
  { a: "ignatius", b: "polycarp", g: 1, quote: "Ignatius, who is also called Theophorus, to Polycarp, Bishop of the Church of the Smyrnaeans.", cite: "Ignatius, Letter to Polycarp (c. AD 110)",
    text: "Ignatius wrote to Polycarp directly, and Polycarp's own Letter to the Philippians (ch. 13) mentions collecting and sending on Ignatius's letters." },
  { a: "john", b: "papias", g: 3, quote: "These things are borne witness to in writing by Papias, the hearer of John, and a companion of Polycarp.", cite: "Irenaeus, Against Heresies 5.33.4",
    text: "Irenaeus calls Papias a hearer of John.",
    note: "Eusebius disagreed: reading Papias's own preface, he concluded Papias meant a different John, 'the Elder', and did not hear the apostles himself (Church History 3.39)." },
  { a: "papias", b: "polycarp", g: 2, met: true, quote: "Papias, the hearer of John, and a companion of Polycarp.", cite: "Irenaeus, Against Heresies 5.33.4",
    text: "Irenaeus, who knew Polycarp, places Papias in his circle. Both were bishops in Asia Minor in the same years." },
  { a: "justin", b: "tatian", g: 1, quote: "He was a hearer of Justin's.", cite: "Irenaeus, Against Heresies 1.28.1",
    text: "Tatian himself refers to 'the most admirable Justin' in his Address to the Greeks (ch. 18), confirming the link in his own words." },
  { a: "irenaeus", b: "hippolytus", g: 3, quote: "Hippolytus was a disciple of Irenaeus.", cite: "Photius, Bibliotheca 121 (9th century, paraphrased)",
    text: "The claim first appears some six centuries later. Hippolytus's own theology owes a clear debt to Irenaeus, which may explain the tradition.",
    note: "Many scholars treat this as an inference, not a record." },
  { a: "pantaenus", b: "clementA", g: 2, quote: "The last whom I met was the first in power; having tracked him out concealed in Egypt, I found rest.", cite: "Clement of Alexandria, Stromata 1.1",
    text: "Clement describes his last and greatest teacher without naming him. Eusebius, who read Clement's lost Outlines, says Clement named Pantaenus as his teacher there (Church History 5.11; 6.13)." },
  { a: "clementA", b: "origen", g: 3, quote: "Origen was one of his pupils while he was still a boy.", cite: "Eusebius, Church History 6.6 (paraphrased)",
    text: "Eusebius makes Origen a student of Clement at Alexandria.",
    note: "Origen never names Clement in his surviving works, and many modern scholars doubt the link." },
  // Jerusalem
  { a: "jesus", b: "james", g: 1, more: true, quote: "After that, he was seen of James; then of all the apostles.", cite: "Paul, 1 Corinthians 15:7 (c. AD 54)",
    text: "James was Jesus's brother (Mark 6:3; Galatians 1:19). The Gospels say his brothers did not believe in him during his ministry (John 7:5); Paul nevertheless lists him among those who saw the risen Jesus, and he went on to lead the church in Jerusalem." },
  { a: "paul", b: "james", g: 1, met: true, more: true, quote: "But other of the apostles saw I none, save James the Lord's brother.", cite: "Paul, Galatians 1:19",
    text: "Paul's own account of his first visit to Jerusalem, about three years after his conversion. He met James again on the later visit of Galatians 2:9, and Acts 21:18 has them meet a third time." },
  { a: "peter", b: "james", g: 1, met: true, more: true, quote: "James, Cephas, and John, who seemed to be pillars, gave to me and Barnabas the right hands of fellowship.", cite: "Paul, Galatians 2:9",
    text: "Paul saw the two together in Jerusalem. Acts agrees: Peter, escaping from prison, says 'Go shew these things unto James' (Acts 12:17), and both speak at the council of Acts 15." },
  // Paul's companions
  { a: "paul", b: "barnabas", g: 1, met: true, more: true, quote: "Then fourteen years after I went up again to Jerusalem with Barnabas, and took Titus with me also.", cite: "Paul, Galatians 2:1",
    text: "Paul names Barnabas as his companion in his own letters (Galatians 2:1, 9, 13; 1 Corinthians 9:6). Acts adds that Barnabas introduced Paul to the apostles (9:27), fetched him to Antioch (11:25–26) and travelled with him until they parted (15:39)." },
  { a: "barnabas", b: "mark", g: 1, more: true, quote: "And so Barnabas took Mark, and sailed unto Cyprus.", cite: "Acts 15:39; see also Colossians 4:10",
    text: "Colossians calls Mark 'sister's son to Barnabas'. When Paul and Barnabas separated, Mark went with his cousin.",
    note: "Acts was written some decades after the event, and the authorship of Colossians is debated; the kinship itself is not in doubt." },
  { a: "paul", b: "timothy", g: 1, more: true, quote: "But ye know the proof of him, that, as a son with the father, he hath served with me in the gospel.", cite: "Paul, Philippians 2:22; see also 1 Thessalonians 3:2",
    text: "Timothy is co-sender of six of Paul's letters and his messenger to Thessalonica and Corinth (1 Thessalonians 3:2; 1 Corinthians 4:17). Acts 16:1–3 has Paul recruit him at Lystra." },
  { a: "paul", b: "silvanus", g: 1, more: true, quote: "Paul, and Silvanus, and Timotheus, unto the church of the Thessalonians.", cite: "Paul, 1 Thessalonians 1:1 (c. AD 50)",
    text: "Silvanus is co-sender of both letters to Thessalonica and preached with Paul at Corinth (2 Corinthians 1:19). Acts calls him Silas, one of the 'chief men among the brethren' sent from Jerusalem (Acts 15:22, 40)." },
  { a: "peter", b: "silvanus", g: 3, met: true, more: true, quote: "By Silvanus, a faithful brother unto you, as I suppose, I have written briefly.", cite: "1 Peter 5:12",
    text: "If this is the same Silvanus, he carried or wrote down Peter's letter, which would make him a link between Paul's circle and Peter's.",
    note: "Many scholars doubt that Peter wrote 1 Peter; 'by Silvanus' may mean only that he carried it; and the identification with Paul's Silvanus is an inference." },
  // Rome
  { a: "peter", b: "linus", g: 3, more: true, quote: "The blessed apostles, then, having founded and built up the Church, committed into the hands of Linus the office of the episcopate.", cite: "Irenaeus, Against Heresies 3.3.3 (c. AD 180)",
    text: "Irenaeus, listing the bishops of Rome, begins with Linus; Eusebius repeats him (Church History 3.2; 3.4).",
    note: "Irenaeus wrote more than a century later and is the earliest source. Tertullian has Peter ordain Clement instead, and Clement's own letter knows no single bishop at Rome." },
  { a: "paul", b: "linus", g: 3, more: true, quote: "Eubulus greeteth thee, and Pudens, and Linus, and Claudia, and all the brethren.", cite: "2 Timothy 4:21",
    text: "A Linus sends greetings from Paul's company at Rome. Irenaeus says this is the same man: 'Of this Linus, Paul makes mention in the Epistles to Timothy.'",
    note: "Most scholars date 2 Timothy after Paul's death, and the identification of the two men is Irenaeus's own." },
  { a: "polycarp", b: "anicetus", g: 2, met: true, more: true, quote: "And when the blessed Polycarp was at Rome in the time of Anicetus, and they disagreed a little about certain other things, they immediately made peace with one another.", cite: "Irenaeus, Letter to Victor, quoted by Eusebius, Church History 5.24.16",
    text: "Polycarp visited Rome about AD 154–155, in his old age. Irenaeus also mentions the visit in Against Heresies 3.3.4: 'coming to Rome in the time of Anicetus'. The two bishops could not agree on the date of Easter and kept communion anyway." },
  { a: "hegesippus", b: "anicetus", g: 1, met: true, more: true, quote: "And when I had come to Rome I remained there until Anicetus, whose deacon was Eleutherus.", cite: "Hegesippus, Memoirs, quoted by Eusebius, Church History 4.22.3",
    text: "Hegesippus's own words. On the way he stayed with the church at Corinth, and in Rome he saw Anicetus, then Soter, then Eleutherus.",
    note: "The Greek is uncertain: the manuscripts say Hegesippus 'drew up a succession' at Rome, which many editors emend to 'remained', as McGiffert translates." },
  // Smyrna to Rome
  { a: "polycarp", b: "florinus", g: 1, more: true, quote: "For when I was a boy, I saw thee in lower Asia with Polycarp, moving in splendor in the royal court, and endeavoring to gain his approbation.", cite: "Irenaeus, Letter to Florinus, quoted by Eusebius, Church History 5.20.5",
    text: "Irenaeus writes to Florinus as a fellow hearer of Polycarp, reminding him of what they both heard. Florinus, a man of some standing, had sought the old bishop's good opinion." },
  { a: "irenaeus", b: "florinus", g: 1, met: true, more: true, quote: "These doctrines, O Florinus, to speak mildly, are not of sound judgment… For when I was a boy, I saw thee in lower Asia with Polycarp.", cite: "Irenaeus, Letter to Florinus, quoted by Eusebius, Church History 5.20.4–5",
    text: "The two knew each other in youth at Smyrna. Later, when Florinus was a presbyter at Rome drawn to the teaching of Valentinus, Irenaeus wrote this letter and a treatise On the Ogdoad against him (Church History 5.20.1)." },
  // Origen's circle
  { a: "origen", b: "africanus", g: 1, met: true, more: true, quote: "Origen to Africanus, a beloved brother in God the Father, through Jesus Christ, His holy Child, greeting.", cite: "Origen, Letter to Africanus 1 (c. AD 240)",
    text: "Both letters survive. Africanus had heard Origen debate a certain Bassus and cite the story of Susanna; he wrote to argue the story was not part of the original Daniel, and Origen replied at length from Nicomedia. Eusebius mentions the exchange (Church History 6.31)." },
  { a: "origen", b: "gregory", g: 1, more: true, quote: "We were pierced by his argumentation as with an arrow from the very first occasion of our hearing him.", cite: "Gregory Thaumaturgus, Address of Thanksgiving to Origen 6 (c. AD 238)",
    text: "Gregory's farewell speech to his teacher, delivered in Origen's presence after five years at Caesarea. Eusebius confirms it: Gregory and his brother Athenodorus, 'remaining with him five years', became bishops in Pontus (Church History 6.30).",
    note: "A few scholars have questioned whether the speech is really by Gregory of Neocaesarea; most accept it." },
  { a: "origen", b: "dionysiusA", g: 2, more: true, quote: "Heraclas, having received the episcopal office after Demetrius, was succeeded in the charge of the catechetical school by Dionysius, who had also been one of Origen's pupils.", cite: "Eusebius, Church History 6.29.4",
    text: "Eusebius had Dionysius's letters, among them one addressed to Origen 'on Martyrdom' (Church History 6.46.2). Jerome calls Dionysius 'the most distinguished pupil of Origen'.",
    note: "Eusebius wrote some sixty years after Dionysius's death, but worked from Dionysius's own correspondence." },
  // Alexandria and Caesarea after Origen
  { a: "origen", b: "pamphilus", g: 1, kept: true, more: true, quote: "We give in that a catalogue of the library which he collected of the works of Origen and of other ecclesiastical writers.", cite: "Eusebius, Church History 6.32.3",
    text: "Pamphilus never met Origen, who died when he was a boy. He gathered Origen's writings at Caesarea and, Jerome says, 'transcribed the greater part of the works of Origen with his own hand' (Lives of Illustrious Men 75). This thread marks custody of the writings, not acquaintance." },
  { a: "pierius", b: "pamphilus", g: 3, more: true, quote: "Pierius the presbyter, who is said… to have been the teacher of the martyr Pamphilus in theology and head of the catechetical school at Alexandria.", cite: "Photius, Bibliotheca 119 (9th century)",
    text: "Pamphilus came from Berytus and studied at Alexandria before settling in Caesarea; Photius makes Pierius his teacher there.",
    note: "The claim first appears six centuries later, with 'is said'. Eusebius, who knew both men, never states it." },
  { a: "eusebius", b: "pierius", g: 1, met: true, more: true, quote: "Among those nearest our times, we have known Pierius, of the presbyters in Alexandria, and Meletius, bishop of the churches in Pontus — rarest of men.", cite: "Eusebius, Church History 7.32.26",
    text: "Eusebius names Pierius among the men of his own day whom he knew.",
    note: "The verb can mean 'came to know' in person or merely 'knew of'; most readers take it as acquaintance." },
  { a: "pamphilus", b: "eusebius", g: 1, more: true, quote: "In his time we became acquainted with Pamphilus, that most eloquent man, of truly philosophical life, who was esteemed worthy of the office of presbyter in that parish.", cite: "Eusebius, Church History 7.32.25",
    text: "Eusebius's own words. He calls Pamphilus 'a man thrice dear to me' (Martyrs of Palestine 11.1), wrote his life in three books, now lost, and took the surname 'Pamphili' from him. The two were imprisoned together in the persecution and wrote the Defence of Origen jointly." },
  { a: "origen", b: "eusebius", g: 1, kept: true, more: true, quote: "But whatever it has seemed necessary to record about him can be found in the Apology in his behalf written by us and Pamphilus, the holy martyr of our day.", cite: "Eusebius, Church History 6.33.4",
    text: "Eusebius was born some years after Origen died and never claims to have met him. What he knew came from the library at Caesarea, from Origen's letters, which he collected into a hundred books (6.36.3), and from 'the elder brethren among us' (6.33.4). This thread marks custody of the writings, not acquaintance." },
  // The women at the tomb
  { a: "jesus", b: "mary", g: 1, more: true, quote: "Mary Magdalene came and told the disciples that she had seen the Lord, and that he had spoken these things unto her.", cite: "John 20:18",
    text: "Luke 8:2 names her among the women who followed Jesus in Galilee, and all four Gospels put her at the cross and at the empty tomb (Mark 15:40; 16:1; Matthew 27:56; 28:1; Luke 24:10; John 19:25). In John, and in Matthew 28:9, the risen Jesus appears to her before anyone else.",
    note: "Paul's list of appearances (1 Corinthians 15:5–8) names no women. The appearance to her in Mark 16:9 belongs to the longer ending, which the oldest manuscripts lack." },
  { a: "mary", b: "peter", g: 1, met: true, more: true, quote: "Then she runneth, and cometh to Simon Peter, and to the other disciple, whom Jesus loved, and saith unto them, They have taken away the Lord out of the sepulchre.", cite: "John 20:2",
    text: "Luke agrees in substance: the women 'told these things unto the apostles' (Luke 24:10). This thread marks the morning on which word of the empty tomb reached the Twelve.",
    note: "The 'other disciple' is traditionally John, which would add a thread to him; the Gospel itself never gives the name." },
  // Caesarea to Hierapolis
  { a: "paul", b: "philip", g: 1, met: true, more: true, quote: "And the next day we that were of Paul's company departed, and came unto Caesarea: and we entered into the house of Philip the evangelist, which was one of the seven; and abode with him.", cite: "Acts 21:8–9",
    text: "On Paul's last journey to Jerusalem, about AD 57, his party stayed some days in Philip's house at Caesarea. The narrator writes 'we': if he is Luke, he met Philip and the four daughters 'which did prophesy' himself.",
    note: "Acts alone records the visit; Paul's letters never mention Philip." },
  { a: "philip", b: "papias", g: 2, more: true, quote: "Papias, their contemporary, says that he heard a wonderful tale from the daughters of Philip.", cite: "Eusebius, Church History 3.39.9",
    text: "Papias's own claim, known only through Eusebius's summary of his lost book: the daughters told him of a man raised from the dead in their day. Polycrates of Ephesus, about AD 190, and the Roman Proclus both place Philip and his daughters at Hierapolis, Papias's own city (Church History 3.31.3–4; 5.24.2).",
    note: "Polycrates calls this Philip 'one of the twelve apostles', while Acts makes the father of the prophesying daughters Philip the evangelist, one of the Seven. Eusebius ran the two together, and many historians think the tradition in Asia had already done so." },
  // Paul's companions
  { a: "paul", b: "titus", g: 1, more: true, quote: "Whether any do enquire of Titus, he is my partner and fellowhelper concerning you.", cite: "Paul, 2 Corinthians 8:23",
    text: "Titus appears only in Paul's letters, never in Acts. Paul took him to Jerusalem as a Greek convert and refused to have him circumcised (Galatians 2:1–3), and later sent him to Corinth to settle the quarrel there (2 Corinthians 2:13; 7:6; 12:18). The letter to Titus addresses him in Crete.",
    note: "Most scholars date the letter to Titus after Paul's death; the threads from the undisputed letters stand on their own." },
  // Ephesus
  { a: "ignatius", b: "onesimus", g: 1, met: true, more: true, quote: "I received, therefore, your whole multitude in the name of God, through Onesimus, a man of inexpressible love, and your bishop in the flesh.", cite: "Ignatius, Letter to the Ephesians 1 (c. AD 110)",
    text: "Ignatius's own words, written at Smyrna after the Ephesian delegation under Onesimus had come to see him on his way to Rome. He names Onesimus again with the deacon Burrhus and the others who came (ch. 2), and reports what Onesimus told him of the church's good order (ch. 6)." },
  // Alexandria and Rome
  { a: "ammonius", b: "origen", g: 2, more: true, quote: "For this man, having been a hearer of Ammonius, who had attained the greatest proficiency in philosophy of any in our day, derived much benefit from his teacher in the knowledge of the sciences.", cite: "Porphyry, Against the Christians, quoted by Eusebius, Church History 6.19.6",
    text: "Porphyry the Platonist had met Origen as a young man and writes within living memory. Eusebius quotes him to prove Origen's learning, and adds that Ammonius was and remained a Christian (6.19.9–10).",
    note: "Porphyry's Ammonius is almost certainly Ammonius Saccas, the teacher of Plotinus; Eusebius's claim that he stayed a Christian seems to confuse him with a Christian writer of the same name (Jerome, Lives of Illustrious Men 55). A few scholars think Porphyry's Origen was a different man as well." },
  { a: "hippolytus", b: "origen", g: 3, met: true, more: true, quote: "…an exhortation On the praise of our Lord and Saviour, in which he indicates that he is speaking in the church in the presence of Origen.", cite: "Jerome, Lives of Illustrious Men 61 (AD 392–393)",
    text: "Eusebius records that Origen visited Rome under Zephyrinus, about AD 212, 'desiring to see the most ancient church of Rome' (Church History 6.14.10); the homily Jerome describes would belong to that visit. The homily itself is lost.",
    note: "Jerome is the only witness, nearly two centuries later, and did not know where Hippolytus was bishop. Neither man names the other in any surviving work." },
  { a: "paul", b: "priscilla", g: 1, met: true, more: true, quote: "Greet Priscilla and Aquila my helpers in Christ Jesus.", cite: "Paul, Romans 16:3",
    text: "Paul's own greeting, to the couple and to 'the church that is in their house' (Romans 16:5; 1 Corinthians 16:19). Acts has Paul lodge and work with them at Corinth, tentmakers like himself, and sail with them to Ephesus (Acts 18:2–3, 18–19)." },
  { a: "priscilla", b: "apollos", g: 1, more: true, quote: "Whom when Aquila and Priscilla had heard, they took him unto them, and expounded unto him the way of God more perfectly.", cite: "Acts 18:26",
    text: "Apollos reached Ephesus 'knowing only the baptism of John' (Acts 18:25); the couple completed his instruction before he crossed to Corinth (18:27). Only Acts tells the story, but Paul confirms that Apollos was at Ephesus and Corinth in just these years.",
    note: "Acts alone records this; Paul never connects the three names himself." },
  { a: "paul", b: "apollos", g: 1, met: true, more: true, quote: "As touching our brother Apollos, I greatly desired him to come unto you with the brethren: but his will was not at all to come at this time.", cite: "Paul, 1 Corinthians 16:12",
    text: "Paul writes from Ephesus, where Apollos is with him and free to decline. Earlier in the letter he treats him as a colleague, 'I have planted, Apollos watered' (3:6), even while Corinthian factions set the two names against each other (1:12)." },
];


// People pages that have a figure on the chart.
const PEOPLE = { jesus: "jesus", "mary-magdalene": "mary", "james-the-just": "james", eusebius: "eusebius", peter: "peter", "john-son-of-zebedee": "john", paul: "paul", "clement-of-rome": "clement", "ignatius-of-antioch": "ignatius", papias: "papias", polycarp: "polycarp", "justin-martyr": "justin", tatian: "tatian", irenaeus: "irenaeus", origen: "origen" };
const GR = { 1: "In the earliest sources", 2: "Student or near-contemporary", 3: "Later tradition or disputed" };
// Where a thread's quotation can be read on this site (first match wins; no link if the work isn't here).
const SRC = [
  [/Church History (\d)\./, (m) => ["1", "3", "4", "5"].includes(m[1]) && [`fathers/eusebius-he-${m[1]}`, CH_ES ? `Eusebio, Historia eclesiástica, libro ${m[1]}` : `Eusebius, Church History, Book ${m[1]}`]],
  [/Against Heresies (\d)\./, (m) => ["1", "3"].includes(m[1]) && [`fathers/irenaeus-ah-${m[1]}`, CH_ES ? `Ireneo, Contra las herejías, libro ${m[1]}` : `Irenaeus, Against Heresies, Book ${m[1]}`]],
  [/1 Corinthians/, () => ["scripture/new-testament/07-1-corinthians", CH_ES ? "1 Corintios" : "1 Corinthians"]],
  [/Galatians/, () => ["scripture/new-testament/09-galatians", CH_ES ? "Gálatas" : "Galatians"]],
  [/Colossians/, () => ["scripture/new-testament/12-colossians", "Colossians"]],
  [/Philemon/, () => ["scripture/new-testament/18-philemon", "Philemon"]],
  [/^John /, () => ["scripture/new-testament/04-john", CH_ES ? "el Evangelio según Juan" : "the Gospel of John"]],
  [/Romans/, () => ["scripture/new-testament/06-romans", CH_ES ? "Romanos" : "Romans"]],
  [/2 Corinthians/, () => ["scripture/new-testament/08-2-corinthians", CH_ES ? "2 Corintios" : "2 Corinthians"]],
  [/^Acts /, () => ["scripture/new-testament/05-acts", CH_ES ? "Hechos" : "Acts"]],
  [/Philippians/, () => ["scripture/new-testament/11-philippians", CH_ES ? "Filipenses" : "Philippians"]],
  [/1 Thessalonians/, () => ["scripture/new-testament/13-1-thessalonians", CH_ES ? "1 Tesalonicenses" : "1 Thessalonians"]],
  [/^1 Peter/, () => ["scripture/new-testament/21-1-peter", CH_ES ? "1 Pedro" : "1 Peter"]],
  [/^2 Timothy/, () => ["scripture/new-testament/16-2-timothy", CH_ES ? "2 Timoteo" : "2 Timothy"]],
  [/^Mark /, () => ["scripture/new-testament/02-mark", CH_ES ? "el Evangelio según Marcos" : "the Gospel of Mark"]],
];
const sourceOf = (cite) => { for (const [re, f] of SRC) { const m = cite.match(re); if (m) return f(m) || null; } return null; };
const PAGE_OF = Object.fromEntries(Object.entries(PEOPLE).map(([slug, id]) => [id, slug]));
const personLink = (id) => PAGE_OF[id] ? `<a class="d-link" href="#/p/${PAGE_OF[id]}">${N_ALL[id].name}<span aria-hidden="true"> →</span></a>` : "";

const ERAS = [["The Lord", 6, 40, "c. 30"], ["The Apostolic Age", 40, 90, "30–90"], ["After the Apostles", 90, 140, "90–140"], ["The Second Century", 140, 195, "140–195"], ["The Third Century", 195, 250, "195–250"], ["Towards Nicaea", 250, 330, "250–330"]];
const CHAINS = [["jesus,john,polycarp,irenaeus", "John to Irenaeus"], ["jesus,peter,mark", "Peter and Mark"], ["jesus,paul,luke,mark", "Paul's circle"], ["peter,paul,clement", "The church at Rome"], ["pantaenus,clementA,origen", "Alexandria"]];
// Spanish pages load data-js/es/chain.js first (window.CHAIN_ES): names, dates, biographies, the threads' texts
// and the page's own wording. The English citation is kept for finding the source page.
const CH_ES = window.LANG === "es" ? window.CHAIN_ES : null, S = (x) => CH_ES?.strings?.[x] ?? x;
if (CH_ES) {
  for (const [k, v] of Object.entries(CH_ES.nodes || {})) if (N_ALL[k]) Object.assign(N_ALL[k], v);
  (CH_ES.edges || []).forEach((v, i) => { if (E_ALL[i]) { E_ALL[i].citeEn = E_ALL[i].cite; Object.assign(E_ALL[i], v); } });
  ERAS.forEach((r) => (r[0] = S(r[0])));
  CHAINS.forEach((c) => (c[1] = S(c[1])));
  for (const k in GR) GR[k] = S(GR[k]);
}
const ad = (y) => (CH_ES ? `${y} d. C.` : `AD ${y}`);
const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

function render(view, params, onCleanup) {
  // compact=1: the chart alone, for the home page (that page gives its own heading).
  const compact = params.get("compact") === "1";
  // The chain page shows the full chart; the home page keeps the original figures. Figures marked `more` appear only
  // in the full chart.
  const full = !compact;
  const N = Object.fromEntries(Object.entries(N_ALL).filter(([, n]) => full || !n.more));
  const E = E_ALL.filter((e) => full || !e.more);
  const yMax = Math.max(250, ...Object.values(N).map((n) => (n.yr > 250 ? 330 : 250)));
  const laneMax = Math.max(...Object.values(N).map((n) => n.lane));
  view.innerHTML = `
    <section class="chain-page${compact ? " compact" : ""}">
      ${compact ? "" : `<header class="chain-head">
        <div class="chain-kicker">${S("The Chain of Witnesses")}</div>
        <h1>${S("Who knew <em>whom</em>")}</h1>
        <p class="chain-lede">${S("How the testimony about Jesus passed from hand to hand, from the apostles to the bishops and scholars of the third century. Every thread is a claim in an ancient source; tap one to read it.")}</p>
      </header>`}
      <div class="chain-controls"><div class="chain-legend">
        <span><svg width="34" height="4"><line x1="0" y1="2" x2="34" y2="2" stroke="#f2dca1" stroke-width="2.2"/></svg>${S("In the earliest sources")}</span>
        <span><svg width="34" height="4"><line x1="0" y1="2" x2="34" y2="2" stroke="#dcb96f" stroke-width="1.9" stroke-dasharray="9 7"/></svg>${S("Reported by a student or near-contemporary")}</span>
        <span><svg width="34" height="4"><line x1="0" y1="2" x2="34" y2="2" stroke="#b8a785" stroke-width="1.7" stroke-dasharray="1.5 7" stroke-linecap="round"/></svg>${S("Later tradition or disputed")}</span>
        ${full ? `<span><svg width="34" height="4"><line x1="0" y1="2" x2="34" y2="2" stroke="#86b8dc" stroke-width="1.6" stroke-dasharray="14 4 2 4"/></svg>${S("Kept his writings, never met")}</span>` : ""}
      </div></div>
      ${full ? `<p class="chain-hint">${S("Drag or scroll sideways to travel through the centuries")} <span aria-hidden="true">→</span></p>` : ""}
      <div class="chain-stage"><svg class="chain-svg" role="img" aria-label="${S("Diagram of who knew whom among the early Christian witnesses")}"></svg></div>
    </section>`;
  const drawer = document.createElement("aside");
  drawer.className = "chain-drawer";
  drawer.setAttribute("aria-live", "polite");
  drawer.innerHTML = `<button class="x" type="button" aria-label="${S("Close")}">×</button><div class="dbody"></div>`;
  document.body.appendChild(drawer);
  const dbody = drawer.querySelector(".dbody");
  // Touch screens have no hover: the first tap shows the threads (what hovering does with a mouse)
  // and a small bar to open the details; a second tap on the same thing, or the bar, opens them.
  const peek = document.createElement("div");
  peek.className = "chain-peek";
  peek.innerHTML = `<span class="pk-name"></span><button type="button" class="pk-open">${S("Details")}</button><button type="button" class="pk-x" aria-label="${S("Clear")}">×</button>`;
  document.body.appendChild(peek);
  let peeked = null, peekOpen = null;
  const noHover = () => !matchMedia("(hover: hover)").matches;
  function touchFirst(key, name, show, open) {
    if (!noHover() || drawer.classList.contains("open")) return false;
    if (peeked === key) { hidePeek(); return false; }
    reset(); locked = true; show();
    peeked = key; peekOpen = open;
    peek.querySelector(".pk-name").textContent = name;
    peek.classList.add("on");
    return true;
  }
  function hidePeek() { peeked = null; peekOpen = null; peek.classList.remove("on"); }
  peek.addEventListener("click", (ev) => ev.stopPropagation());
  peek.querySelector(".pk-open").addEventListener("click", () => { const f = peekOpen; hidePeek(); f && f(); });
  peek.querySelector(".pk-x").addEventListener("click", () => reset());
  const svg = view.querySelector(".chain-svg"), stage = view.querySelector(".chain-stage");
  // Wide chart: drag sideways with the mouse (touch and trackpads scroll natively); a drag never counts as a click.
  let drag = null, dragged = false;
  stage.addEventListener("pointerdown", (ev) => { if (!stage.classList.contains("scroll") || ev.pointerType !== "mouse") return; drag = { x: ev.clientX, l: stage.scrollLeft }; dragged = false; });
  const onMove = (ev) => { if (!drag) return; const dx = ev.clientX - drag.x; if (Math.abs(dx) > 5) { dragged = true; stage.classList.add("dragging"); } if (dragged) stage.scrollLeft = drag.l - dx; };
  const onUp = () => { drag = null; stage.classList.remove("dragging"); };
  stage.addEventListener("click", (ev) => { if (dragged) { ev.stopPropagation(); ev.preventDefault(); dragged = false; } }, true);
  const mq = matchMedia("(max-width: 760px)");
  let locked = false;
  const offs = [];
  const on = (t, ev, f) => { t.addEventListener(ev, f); offs.push(() => t.removeEventListener(ev, f)); };
  on(window, "pointermove", onMove); on(window, "pointerup", onUp);

  function draw() {
    const vert = mq.matches;
    svg.innerHTML = "";
    svg.classList.toggle("vert", vert);
    svg.classList.remove("focus");
    // Desktop: time runs left to right. Phone: time runs top to bottom, lanes across.
    // The full chart on a wide screen gets more room than the screen has: it is drawn wider and scrolls sideways.
    const wide = full && !vert && yMax > 250;
    // Wide chart: the apostles' years (AD 40–90), the most crowded, get half again as much room as the rest.
    const wideT = (yr) => yr <= 40 ? 96 + (yr - 6) * 9.6 : yr <= 90 ? 422.4 + (yr - 40) * 15 : 1172.4 + (yr - 90) * 9.6;
    const vertT = full ? (yr) => yr <= 40 ? 120 + (yr - 6) * 7.1 : yr <= 90 ? 361.4 + (yr - 40) * 12 : 961.4 + (yr - 90) * 7.1 : (yr) => 120 + (yr - 6) * 7.1;
    const T = vert ? vertT : wide ? wideT : (yr) => 96 + (yr - 6) * 6.0;
    const L = vert ? (lane) => 56 + Math.min(1, 6.6 / laneMax) * lane * 57 : wide ? (lane) => 170 + lane * 112 : (lane) => 170 + lane * 100;
    const W = vert ? 480 : Math.round(T(yMax) + 40), H = vert ? Math.round(T(yMax) + 28) : wide ? Math.round(L(laneMax) + 150) : (laneMax > 6.6 ? 1100 : 1000);
    svg.classList.toggle("wide", wide);
    stage.classList.toggle("scroll", wide);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    for (const id in N) { const n = N[id]; n.id = id; n.x = vert ? L(n.lane) : T(n.yr); n.y = vert ? T(n.vyr ?? n.yr) : L(n.lane); }

    const defs = el("defs", {}, svg);
    const lg = el("linearGradient", { id: "gilt", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
    [["0", "#f6dea0"], [".25", "#b78a3c"], [".5", "#6e4d1c"], [".68", "#d9b46a"], [".85", "#8b6527"], ["1", "#e8c97f"]].forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, lg));
    const bg = el("linearGradient", { id: "gold-bright", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
    [["0", "#fff3c8"], [".25", "#f2c96a"], [".5", "#c99a3f"], [".68", "#ffe29a"], [".85", "#e0b052"], ["1", "#fff0bd"]].forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, bg));
    const sg = el("linearGradient", { id: "silver", x1: "0", y1: "0", x2: "1", y2: "1" }, defs);
    [["0", "#f4f6f9"], [".25", "#a3a9b1"], [".5", "#575c63"], [".68", "#d6dae0"], [".85", "#7a8088"], ["1", "#e8ebef"]].forEach(([o, c]) => el("stop", { offset: o, "stop-color": c }, sg));
    const rg = el("radialGradient", { id: "rootglow" }, defs);
    el("stop", { offset: "0", "stop-color": "rgba(242,220,161,.28)" }, rg); el("stop", { offset: "1", "stop-color": "rgba(242,220,161,0)" }, rg);
    const haze = el("filter", { id: "chain-haze", x: "-30%", y: "-60%", width: "160%", height: "220%" }, defs);
    el("feGaussianBlur", { stdDeviation: vert ? 5 : 6 }, haze);

    const bands = el("g", {}, svg);
    ERAS.filter(([, a]) => a < yMax).forEach(([t, a, b, yrs]) => {
      const g = el("g", { class: "band" }, bands);
      if (vert) {
        el("rect", { x: 0, y: T(a), width: W, height: T(b) - T(a) }, g);
        const tx = el("text", { x: 12, y: T(a) + 26 }, g); tx.textContent = t;
        const ty = el("text", { x: 12, y: T(a) + 48, class: "yrs" }, g); ty.textContent = ad(yrs);
      } else {
        el("rect", { x: T(a), y: 40, width: T(b) - T(a), height: H - 100 }, g);
        const tx = el("text", { x: (T(a) + T(b)) / 2, y: 76, "text-anchor": "middle" }, g); tx.textContent = t;
        const ty = el("text", { x: (T(a) + T(b)) / 2, y: 101, "text-anchor": "middle", class: "yrs" }, g); ty.textContent = ad(yrs);
      }
    });
    if (!vert) {
      const ax = el("g", { class: "axis" }, svg);
      el("line", { x1: T(6), x2: T(yMax), y1: H - 40, y2: H - 40 }, ax);
      for (let y = 30; y <= yMax; y += 20) {
        const t = el("g", { class: "tick" }, ax);
        el("line", { x1: T(y), x2: T(y), y1: H - 46, y2: H - 34 }, t);
        const tx = el("text", { x: T(y), y: H - 10, "text-anchor": "middle" }, t); tx.textContent = ad(y);
      }
    }
    const ad70 = el("g", { class: "ad70" }, svg);
    if (vert) {
      el("line", { x1: 8, x2: W - 8, y1: T(70), y2: T(70) }, ad70);
      const t70 = el("text", { x: W - 10, y: T(70) - 8, "text-anchor": "end" }, ad70); t70.textContent = S("Fall of Jerusalem, AD 70");
    } else {
      el("line", { x1: T(70), x2: T(70), y1: 118, y2: H - 46 }, ad70);
      const t70 = el("text", { x: T(70) + 8, y: 136 }, ad70); t70.textContent = S("Fall of Jerusalem, AD 70");
    }

    const edgeG = el("g", { class: "edges" }, svg);
    E.forEach((e, i) => {
      const A = N[e.a], B = N[e.b];
      let d;
      if (vert) {
        const dy = Math.max(40, (B.y - A.y) * .55);
        d = e.met && Math.abs(A.y - B.y) < 90 ? `M${A.x},${A.y} C${A.x},${A.y + 70} ${B.x},${B.y + 70} ${B.x},${B.y}` : `M${A.x},${A.y} C${A.x},${A.y + dy} ${B.x},${B.y - dy} ${B.x},${B.y}`;
      } else {
        const dx = Math.max(60, (B.x - A.x) * .55);
        d = e.met && Math.abs(A.x - B.x) < 120 ? `M${A.x},${A.y} C${A.x + 90},${A.y} ${B.x + 90},${B.y} ${B.x},${B.y}` : `M${A.x},${A.y} C${A.x + dx},${A.y} ${B.x - dx},${B.y} ${B.x},${B.y}`;
      }
      const g = el("g", { class: `edge g${e.g}${e.met ? " met" : ""}${e.kept ? " kept" : ""}` }, edgeG);
      el("path", { d, class: "vis", id: "chain-p" + i }, g);
      el("path", { d, class: "hit" }, g);
      e.g_el = g;
      g.addEventListener("click", (ev) => { ev.stopPropagation(); if (touchFirst("e" + i, `${N[e.a].name} → ${N[e.b].name}`, () => focus(new Set([e.a, e.b]), new Set([i])), () => openEdge(i))) return; openEdge(i); });
      g.addEventListener("mouseenter", () => { if (!locked) focus(new Set([e.a, e.b]), new Set([i])); });
      g.addEventListener("mouseleave", () => { if (!locked) unfocus(); });
    });

    const nodeG = el("g", {}, svg);
    const labels = [];
    Object.values(N).forEach((n) => {
      const r = vert ? (n.root ? 36 : 27) : (n.root ? 50 : 38);
      const pos = el("g", { transform: `translate(${n.x},${n.y})` }, nodeG);
      const g = el("g", { class: "node" + (n.root ? " root" : n.ap ? " apostle" : "") }, pos);
      g.style.animationDelay = (0.4 + (n.yr - 23) / (yMax - 30) * 2.8).toFixed(2) + "s";
      if (n.root) el("circle", { r: vert ? 80 : 110, fill: "url(#rootglow)" }, g);
      el("circle", { r: r + 8, class: "halo" }, g);
      el("circle", { r, class: "mono" }, g);
      if (n.img) {
        const cp = el("clipPath", { id: "chain-c-" + n.id }, defs); el("circle", { r }, cp);
        const href = `art/sm/${n.img}.webp`;
        if (n.face) {
          const [fx, fy, z, ar] = n.face, w = r * 2 * z, h = w * ar;
          el("image", { href, x: -fx * w, y: -fy * h, width: w, height: h, "clip-path": `url(#chain-c-${n.id})` }, g);
        } else el("image", { href, x: -r, y: -r, width: r * 2, height: r * 2, preserveAspectRatio: "xMidYMid slice", "clip-path": `url(#chain-c-${n.id})` }, g);
      } else { const t = el("text", { class: "mono-t" + (n.mono.length > 1 ? " two" : "") }, g); t.textContent = n.mono; }
      el("circle", { r, class: "ring" }, g);
      // On phones long names break onto two lines and labels are kept inside the chart's edges.
      const of = CH_ES ? " de " : " of ";
      const and = CH_ES ? " y " : " and ", brk = n.name.includes(of) ? of : n.name.includes(and) ? and : null;
      const lines = vert && n.name.length > 12 && brk ? [n.name.slice(0, n.name.indexOf(brk)), n.name.slice(n.name.indexOf(brk) + 1)] : [n.name];
      const fs = vert ? (n.root ? 19 : 16.5) : 0;
      const est = vert ? Math.max(...lines.map((l) => l.length)) * fs * .78 : 0;
      let shift = 0;
      if (vert && n.x - est / 2 < 6) shift = 6 - (n.x - est / 2);
      if (vert && n.x + est / 2 > W - 6) shift = W - 6 - (n.x + est / 2);
      const bg = el("rect", { class: "label-bg", rx: 10, filter: "url(#chain-haze)" }, g);
      const nm = el("text", { y: r + (vert ? 21 : wide ? 30 : 26), x: shift, class: "name" }, g);
      lines.forEach((l, k) => { const ts = el("tspan", { x: shift, dy: k ? (vert ? 19 : 18) : 0 }, nm); ts.textContent = l; });
      const dt = el("text", { y: r + (vert ? 39 : wide ? 56 : 47) + (lines.length - 1) * 19, x: shift, class: "date" }, g); dt.textContent = n.date;
      labels.push([bg, nm, dt]);
      n.g_el = g;
      g.addEventListener("click", (ev) => { ev.stopPropagation(); if (touchFirst("n" + n.id, n.name, () => focusLineage(n.id), () => openNode(n.id))) return; openNode(n.id); });
      g.addEventListener("mouseenter", () => { if (!locked) focusLineage(n.id); });
      g.addEventListener("mouseleave", () => { if (!locked) unfocus(); });
    });
    pulses = el("g", {}, svg);
    // Size each label's soft backing to its text once the fonts are in, so threads pass behind the names.
    const fit = () => labels.forEach(([bg, nm, dt]) => {
      const a = nm.getBBox(), b = dt.getBBox();
      const x = Math.min(a.x, b.x) - 8, y = a.y - 4, w = Math.max(a.x + a.width, b.x + b.width) - x + 8, h = b.y + b.height - y + 4;
      bg.setAttribute("x", x); bg.setAttribute("y", y); bg.setAttribute("width", w); bg.setAttribute("height", h);
    });
    fit();
    document.fonts?.ready.then(fit);
  }

  let pulses = null;
  function focus(nodes, edges) {
    svg.classList.add("focus");
    Object.values(N).forEach((n) => n.g_el.classList.toggle("on", nodes.has(n.id)));
    E.forEach((e, i) => e.g_el.classList.toggle("on", edges.has(i)));
    pulses.innerHTML = "";
    edges.forEach((i) => {
      const c = el("circle", { r: mq.matches ? 3 : 3.6, class: "pulse" }, pulses);
      const m = el("animateMotion", { dur: "2.4s", repeatCount: "indefinite", begin: (Math.random() * 1.2).toFixed(2) + "s" }, c);
      el("mpath", { href: "#chain-p" + i }, m);
    });
  }
  function unfocus() {
    svg.classList.remove("focus"); pulses.innerHTML = "";
    Object.values(N).forEach((n) => n.g_el.classList.remove("on", "sel"));
    E.forEach((e) => e.g_el.classList.remove("on", "sel"));
  }
  function focusLineage(id) {
    const nodes = new Set([id]), edges = new Set();
    const walk = (cur, dir) => E.forEach((e, i) => {
      if (e.met) { if (e.a === id || e.b === id) { edges.add(i); nodes.add(e.a); nodes.add(e.b); } return; }
      const from = dir > 0 ? e.a : e.b, to = dir > 0 ? e.b : e.a;
      if (from === cur && !edges.has(i)) { edges.add(i); nodes.add(to); walk(to, dir); }
    });
    walk(id, 1); walk(id, -1);
    focus(nodes, edges);
  }
  const chainBtns = () => view.querySelectorAll(".chain-chains button");
  function reset() { drawer.classList.remove("open"); hidePeek(); locked = false; unfocus(); chainBtns().forEach((x) => x.classList.remove("on")); }
  function openEdge(i) {
    const e = E[i], A = N[e.a], B = N[e.b];
    locked = true; focus(new Set([e.a, e.b]), new Set([i])); e.g_el.classList.add("sel");
    dbody.innerHTML = `
      <div class="d-kick">${S(e.kept ? "Kept his writings" : e.met ? "They met" : "Passed on")}</div>
      <div class="d-title">${A.name}<span class="arr">${e.met ? "&amp;" : e.kept ? "⇢" : "→"}</span>${B.name}</div>
      <span class="grade g${e.g}"><i></i>${GR[e.g]}</span>
      <blockquote>“${e.quote}”<cite>${e.cite}</cite></blockquote>
      <p>${e.text}</p>
      ${e.note ? `<p class="note">${e.note}</p>` : ""}
      ${(() => { const s = sourceOf(e.citeEn || e.cite); const ppl = [personLink(e.a), personLink(e.b)].filter(Boolean);
        return (s ? `<a class="d-src" href="#/doc/${s[0]}">${S("Read it in")} ${s[1]}<span aria-hidden="true"> →</span></a>` : "")
          + (ppl.length ? `<div class="d-people"><span>${S("About them")}</span>${ppl.join("")}</div>` : ""); })()}`;
    drawer.scrollTop = 0;
    drawer.classList.add("open");
  }
  function openNode(id) {
    const n = N[id];
    locked = true; focusLineage(id); n.g_el.classList.add("sel");
    const rel = E.map((e, i) => [e, i]).filter(([e]) => e.a === id || e.b === id);
    dbody.innerHTML = `
      <div class="d-kick">${S("Witness")}</div>
      ${n.img ? `<img class="portrait" src="art/sm/${n.img}.webp" alt="">${n.credit ? `<small class="d-credit">${n.credit}</small>` : ""}` : ""}
      <div class="d-title">${n.name}</div>
      <em class="d-date">${n.date}</em>
      <p>${n.bio}</p>
      ${PAGE_OF[id] ? `<a class="d-src" href="#/p/${PAGE_OF[id]}">${S("Everything on")} ${n.name}<span aria-hidden="true"> →</span></a>` : ""}
      <ul class="links">${rel.map(([e, i]) => { const o = N[e.a === id ? e.b : e.a]; return `<li><button type="button" data-i="${i}"><span>${e.a === id ? "→ " : "← "}${o.name}</span><small>${GR[e.g]}</small></button></li>`; }).join("")}</ul>`;
    dbody.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => openEdge(+b.dataset.i)));
    drawer.scrollTop = 0;
    drawer.classList.add("open");
  }

  draw();
  chainBtns().forEach((b) => b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const was = b.classList.contains("on");
    reset();
    if (was) return;
    b.classList.add("on");
    const ids = new Set(b.dataset.chain.split(","));
    const edges = new Set(); E.forEach((e, i) => { if (ids.has(e.a) && ids.has(e.b)) edges.add(i); });
    locked = true; focus(ids, edges);
  }));
  drawer.querySelector(".x").addEventListener("click", reset);
  drawer.addEventListener("click", (ev) => ev.stopPropagation());
  on(document, "click", (ev) => { if (locked && !ev.target.closest?.(".chain-chains")) reset(); });
  on(document, "keydown", (ev) => { if (ev.key === "Escape" && locked) reset(); });
  on(mq, "change", () => { reset(); draw(); });

  // ?focus=<people slug> opens the chart on that person.
  const want = compact ? null : PEOPLE[params.get("focus")] || (N[params.get("focus")] ? params.get("focus") : null);
  let t = null;
  if (want) t = setTimeout(() => { openNode(want); N[want].g_el.closest("g").parentNode && view.querySelector(".chain-stage")?.scrollIntoView({ block: "center", behavior: "smooth" }); }, 1100);

  onCleanup(() => { clearTimeout(t); offs.forEach((f) => f()); drawer.remove(); peek.remove(); });
}

LUX.chain = { render, PEOPLE };
})();
