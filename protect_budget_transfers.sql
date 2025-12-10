CREATE OR REPLACE FUNCTION prevent_budget_transfer_modification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the transaction is a budget transfer
  -- We identify it by the specific description pattern used for these transactions
  IF (OLD.description ILIKE 'Genel Merkez Bütçe Aktarımı%') THEN
    IF (TG_OP = 'DELETE') THEN
      RAISE EXCEPTION 'Bütçe aktarımı kaynaklı işlemler silinemez. Lütfen Bütçe Aktarımı sayfasını kullanın.';
    ELSIF (TG_OP = 'UPDATE') THEN
      -- Allow updating notes and documents, but protect critical fields
      -- We check if amount, status, or type is being changed
      IF (NEW.amount != OLD.amount OR NEW.status != OLD.status OR NEW.type != OLD.type) THEN
         RAISE EXCEPTION 'Bütçe aktarımı kaynaklı işlemlerin kritik bilgileri (tutar, durum, tip) değiştirilemez.';
      END IF;
    END IF;
  END IF;
  
  -- For DELETE, we must return OLD (though return value is ignored for row-level before delete)
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_budget_transfer_modification ON transactions;

CREATE TRIGGER check_budget_transfer_modification
BEFORE DELETE OR UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION prevent_budget_transfer_modification();
