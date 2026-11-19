-- English 4.3: new 30-question curriculum uses versioned keys; old 6-question sessions remain untouched.
insert into moymir_private.english_answer_keys(lesson_key,answer_keys) values
 ('eng2:to-be',array[1,0,2,1,0,1,1,2,2,0,1,1,1,0,2,2,0,2,1,1,0,1,0,0,0,1,0,0,1,2]),
 ('eng2:have-got',array[1,2,0,2,0,1,1,0,2,2,2,1,2,0,0,2,0,2,2,2,1,2,0,2,2,0,2,0,0,2]),
 ('eng2:present-simple',array[1,0,2,1,2,0,1,2,2,1,0,2,2,1,0,1,0,2,1,0,2,1,2,2,1,0,1,0,0,0]),
 ('eng2:present-continuous',array[1,2,0,1,1,0,2,1,2,0,0,0,2,1,0,0,1,0,2,2,0,1,1,0,0,1,0,0,2,2]),
 ('eng2:there-is-are',array[1,2,1,0,1,0,1,2,2,2,1,1,1,0,0,2,2,2,1,0,0,2,1,1,1,0,1,1,2,0]),
 ('eng2:past-simple',array[1,0,1,2,0,1,2,1,0,1,1,0,0,1,2,0,2,1,1,0,2,2,1,2,0,2,2,0,0,0]),
 ('eng2:daily-words',array[0,1,2,0,1,2,2,2,2,2,1,1,2,2,2,0,1,2,1,1,1,0,0,2,2,2,2,0,0,1]),
 ('eng2:questions',array[1,0,2,0,1,2,1,0,0,0,0,2,0,2,2,2,1,0,2,2,0,2,1,2,1,0,1,1,1,2])
on conflict(lesson_key) do update set answer_keys=excluded.answer_keys;
