import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setBackgroundColor } from "../store/settingsSlice";

export default function SettingsPanel() {
    const dispatch = useDispatch();
    const backgroundColor = useSelector(state => state.settings.backgroundColor);

    return (
        <div
            style={{
                padding: "10px",
                marginBottom: "20px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                background: "#f9f9f9",
            }}
        >
            <h3>Настройки</h3>

            <label>
                Цвет фона:{" "}
                <input
                    type="color"
                    value={backgroundColor}
                    onChange={e => dispatch(setBackgroundColor(e.target.value))}
                />
            </label>
        </div>
    );
}
