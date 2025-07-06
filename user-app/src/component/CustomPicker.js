import React, { useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";

const CustomPicker = ({ selectedValue, onValueChange }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(selectedValue);
  const [items, setItems] = useState([
    { label: "เนื้อหาที่ไม่เหมาะสม", value: "เนื้อหาที่ไม่เหมาะสม" },
    { label: "สแปม", value: "สแปม" },
    { label: "ข้อมูลเท็จ", value: "ข้อมูลเท็จ" },
    { label: "การละเมิดลิขสิทธิ์", value: "การละเมิดลิขสิทธิ์" },
    { label: "พฤติกรรมที่ไม่เหมาะสม", value: "พฤติกรรมที่ไม่เหมาะสม" },
    { label: "อื่น ๆ", value: "อื่น ๆ" },
  ]);

  const handleChange = (val) => {
    setValue(val);
    onValueChange(val);
  };

  return (
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={handleChange}
      setItems={setItems}
      placeholder="เลือกประเภทการรายงาน"
      style={styles.inputpicker}
      dropDownContainerStyle={styles.dropdown}
      listItemContainerStyle={styles.listItem}
      zIndex={1000}
    />
  );
};

const styles = {
  inputpicker: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 5,
    backgroundColor: "#FFF",
    marginBottom: 20,
    marginTop: 10,
  },

  dropdown: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 5,
    backgroundColor: "#FFF",
    maxHeight: 150,
    marginTop: -10,
  },

  listItem: {
    height: 40,
  },
};

export default CustomPicker;
