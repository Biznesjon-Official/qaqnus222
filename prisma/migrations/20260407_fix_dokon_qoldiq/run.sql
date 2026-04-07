UPDATE ombor_harakati SET joy = 'DOKON'::"Joylashuv" WHERE turi = 'KIRIM' AND joy = 'OMBOR'::"Joylashuv" AND izoh = 'Boshlang''ich qoldiq';
UPDATE ombor_harakati SET joy = 'DOKON'::"Joylashuv" WHERE turi IN ('KIRIM','YOQOTISH') AND joy = 'OMBOR'::"Joylashuv" AND izoh LIKE 'Qoldiq sozlash:%';
