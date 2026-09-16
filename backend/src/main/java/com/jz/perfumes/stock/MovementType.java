package com.jz.perfumes.stock;

public enum MovementType {
    PURCHASE(1), SALE(-1), ADJUSTMENT(0), RETURN(1), LOSS(-1);

    /** +1 entra, -1 sale, 0 el signo lo pone el usuario (ajuste). */
    private final int direction;

    MovementType(int direction) {
        this.direction = direction;
    }

    public int direction() {
        return direction;
    }
}
